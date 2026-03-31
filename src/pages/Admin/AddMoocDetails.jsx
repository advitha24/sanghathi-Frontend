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

const AddMoocDetails = () => {
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
      "SlNo",
      "USN",
      "StudentName",
      "CourseName",
      "Platform",
      "CertificateLink",
      "Man Hours",
      "Start Date",
      "End Date"
    ];

    const exampleRow = [
      1,
      "1CR23IS001",
      "AAMITH PRAMOD",
      "Foundation of Python",
      "Infosys Springboard",
      "https://certificate-link.com"
    ];

    const csvContent = Papa.unparse([headers, exampleRow], { quotes: true });

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "mooc_template.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      try {
        if (!row.USN) throw new Error("USN missing");
        if (!row.CourseName) throw new Error("Course Name missing");

        const response = await axios.get(`${BASE_URL}/users/usn/${row.USN}`);
        const userId = response.data?.userId;

        if (!userId) throw new Error("User not found");

        await axios.post(`${BASE_URL}/students/mooc/${userId}`, {
          studentName: row.StudentName,
          courseName: row.CourseName,
          platform: row.Platform,
          certificateLink: row.CertificateLink
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
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
            Upload MOOC Course Details
          </Typography>

          {/* <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
            Courses for Infosys Springboard:
          </Typography>

          <Typography variant="body2">
            1. Foundation of Python
          </Typography>
          <Typography variant="body2">
            2. Front End Web Development Certification
          </Typography> */}

          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 1, fontStyle: "italic" }}
          >
            ** There is no fixed date of commencement for Infosys Springboard courses **
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6">
            MOOC Course Details Upload
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Upload Instructions
          </Typography>

          <Typography variant="body2">• USN must exist in system</Typography>
          <Typography variant="body2">• Course Name is mandatory</Typography>
          <Typography variant="body2">• Platform should be Infosys Springboard / Coursera / NPTEL etc.</Typography>
          <Typography variant="body2">• Certificate Link must be valid URL</Typography>
        </Box>

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
            <strong>Note:</strong> Ensure certificate link is correct before uploading.
          </Typography>
        </Paper>
      </Paper>
    </Container>
  );
};

export default AddMoocDetails;