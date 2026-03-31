import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Container,
  Paper,
  Stack,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import {
  FileDownload as FileDownloadIcon,
  CloudUpload as CloudUploadIcon,
  HelpOutline as HelpOutlineIcon
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import Papa from "papaparse";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const AddTylMarks = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";

  const [processing, setProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState([]);
  const [file, setFile] = useState(null);

  // ================= TEMPLATE DOWNLOAD =================
  const downloadTemplate = () => {
    const headers = [
      "SlNo", "Email", "FullName", "USN", "Phone", "Branch",

      "L1", "L2", "L3", "L4",
      "A1", "A2", "A3", "A4",
      "S1", "S2", "S3", "S4",

      "C2_Odd", "C2_Full", "C3_Odd", "C3_Full",
      "C4_Odd", "C4_Full", "C5_Full",

      "P1_C", "P2_Python", "P3_Python", "P3_Java",
      "P4_Programming_Part1", "P4_Programming_Part2",
      "P4_MAD_FSD", "P4_DS", "P2Plus_Python"
    ];

    const TotalMarks = [
      "", "", "", "", "", "Total Marks: ",   // for SNo, Email, FullName, etc.

      100, 100, 100, 100,
      100, 100, 100, 100,
      100, 100, 100, 100,

      25, 25, 50, 100, 100, 100, 100,

      100, 100, 100, 100, 100, 100, 100, 100, 100
    ];
    const passingRow = [
      "", "", "", "", "", "Passing Criteria",   // for SNo, Email, FullName, etc.

      65, 65, 70, 70,   // L1, L2, L3, L4
      50, 50, 50, 65,   // A1, A2, A3, A4
      50, 50, 50, 50,   // S1, S2, S3, S4

      10, 10, 50, 50,   // C2, C3 etc (example)
      50, 50, 50,

      50, 50, 60, 60,   // P1, P2 etc
      100, 100, 0, 0
    ];
    const exampleRow = [
      1, "student@cmrit.ac.in", "AAMITH PRAMOD", "1CR23IS001", "9148164893", "ISE",

    ];
    const csv = Papa.unparse([headers, TotalMarks, passingRow, exampleRow], { quotes: true });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "tyl_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ================= LEVEL CALCULATION =================
  const calculateLevel = (marksObj, passingCriteria) => {
    let passed = 0;
    const total = Object.keys(passingCriteria).length;

    for (const key in passingCriteria) {
      const mark = parseInt(marksObj[key] || 0, 10);
      if (mark >= passingCriteria[key]) passed++;
    }

    if (passed === total) return 2;
    if (passed > 0) return 1;
    return 0;
  };

  // ================= FILE UPLOAD =================
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setProcessing(true);
    setErrors([]);
    setSuccessCount(0);
    setErrorCount(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      const results = Papa.parse(content, {
        header: true,
        skipEmptyLines: true
      });
      await processRows(results.data);
    };
    reader.readAsText(uploadedFile);
  };

  // ================= PROCESS ROWS =================
  const processRows = async (rows) => {
    let success = 0;
    let errCount = 0;
    const newErrors = [];

    for (const row of rows) {

      const branch = (row.Branch || "").toLowerCase().trim();

      if (
        !row.USN ||
        branch.includes("total") ||
        branch.includes("passing")
      ) continue;

      try {
        if (!row.USN) throw new Error("USN missing");

        // MARK GROUPS
        const language = { L1: row.L1, L2: row.L2, L3: row.L3, L4: row.L4 };
        const aptitude = { A1: row.A1, A2: row.A2, A3: row.A3, A4: row.A4 };
        const softskill = { S1: row.S1, S2: row.S2, S3: row.S3, S4: row.S4 };
        const core = {
          C2_Odd: row.C2_Odd, C2_Full: row.C2_Full,
          C3_Odd: row.C3_Odd, C3_Full: row.C3_Full,
          C4_Odd: row.C4_Odd, C4_Full: row.C4_Full,
          C5_Full: row.C5_Full
        };
        const programming = {
          P1_C: row.P1_C,
          P2_Python: row.P2_Python,
          P3_Python: row.P3_Python,
          P3_Java: row.P3_Java,
          P4_Programming_Part1: row.P4_Programming_Part1,
          P4_Programming_Part2: row.P4_Programming_Part2,
          P4_MAD_FSD: row.P4_MAD_FSD,
          P4_DS: row.P4_DS,
          P2Plus_Python: row.P2Plus_Python
        };

        // PASS CRITERIA
        const languagePass = { L1: 65, L2: 65, L3: 70, L4: 70 };
        const aptitudePass = { A1: 50, A2: 50, A3: 50, A4: 65 };
        const softPass = { S1: 50, S2: 50, S3: 50, S4: 50 };
        const corePass = {
          C2_Odd: 10, C2_Full: 10,
          C3_Odd: 25, C3_Full: 50,
          C4_Odd: 50, C4_Full: 50,
          C5_Full: 50
        };
        const progPass = {
          P1_C: 50, P2_Python: 50,
          P3_Python: 60, P3_Java: 60,
          P4_Programming_Part1: 70,
          P4_Programming_Part2: 70,
          P4_MAD_FSD: 70,
          P4_DS: 70,
          P2Plus_Python: 60
        };

        const levels = {
          Lx_Level: calculateLevel(language, languagePass),
          Ax_Level: calculateLevel(aptitude, aptitudePass),
          Sx_Level: calculateLevel(softskill, softPass),
          Cx_Level: calculateLevel(core, corePass),
          Px_Level: calculateLevel(programming, progPass)
        };
        const scores = {
          "Language Proficiency in English": {
            target: 4,
            actual: levels.Lx_Level
          },
          "Aptitude": {
            target: 3,
            actual: levels.Ax_Level
          },
          "Core Fundamentals": {
            target: 3,
            actual: levels.Cx_Level
          },
          "Certifications": {
            target: 4,
            actual: 0
          },
          "Experiential Mini Projects": {
            target: 4,
            actual: 0
          },
          "Internships": {
            target: 4,
            actual: 0
          },
          "Soft Skills": {
            target: 3,
            actual: levels.Sx_Level
          }
        };

        const response = await axios.get(`${BASE_URL}/users/usn/${row.USN}`);
        const userId = response.data?._id;
        if (!userId) throw new Error("User not found");

        await axios.post(`${BASE_URL}/students/tyl/${userId}`, {
          language,
          aptitude,
          softskill,
          core,
          programming,
          levels
        });
        await axios.post(`${BASE_URL}/tyl-scores`, {
          userId,
          semester: 1,
          scores
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        success++;
      } catch (error) {
        errCount++;
        newErrors.push(`Error for ${row.USN}: ${error.message}`);
      }
    }

    setSuccessCount(success);
    setErrorCount(errCount);
    setErrors(newErrors);
    setProcessing(false);
  };

  // ================= UI =================
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, mb: 4 }}>
        <Typography variant="h4" align="center" sx={{ mb: 2 }}>
          Upload TYL Marks
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={downloadTemplate}
          >
            Download Template
          </Button>

          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={processing}
          >
            {processing ? "Processing..." : "Upload File"}
            <input
              hidden
              accept=".csv"
              type="file"
              onChange={handleFileUpload}
            />
          </Button>
        </Stack>

        {!processing && (successCount > 0 || errorCount > 0) && (
          <Box sx={{ mt: 3 }}>
            {successCount > 0 && (
              <Alert severity="success">
                Successfully processed: {successCount}
              </Alert>
            )}
            {errorCount > 0 && (
              <Alert severity="error">
                Errors encountered: {errorCount}
              </Alert>
            )}
          </Box>
        )}

        {errors.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <List dense>
              {errors.map((err, index) => (
                <ListItem key={index}>
                  <ListItemText primary={err} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Paper sx={{ mt: 4, p: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Levels are automatically calculated based on passing criteria.
          </Typography>
        </Paper>
      </Paper>
    </Container>
  );
};

export default AddTylMarks;