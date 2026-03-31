import { useState, useContext } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Container,
  Stack,
  Divider,
} from "@mui/material";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import Papa from "papaparse";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { alpha, useTheme } from "@mui/material/styles";

const BASE_URL = import.meta.env.VITE_API_URL;

const AddMarks = () => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState(null);

  const token = localStorage.getItem("token");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFile(file);
  };

  const downloadTemplate = () => {
    const headers = ["Semester", "USN", "Subject Code", "Subject Name", "External Marks", "Attempt", "Passing Date", "CGPA", "Result"];
    const row1 = ["1", "1MS21CS001", "CS101", "Computer Science Basics", "85", "1", "2023-05-15", "8.5", "PASS"];
    const row2 = ["1", "1MS21CS001", "MA101", "Mathematics I", "75", "1", "2023-05-20", "8.5", "PASS"];

    const csvContent = [headers.join(','), row1.join(','), row2.join(',')].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "vtu_marks_template.csv";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const processCSV = (csvData) => {
    const studentGroups = new Map();

    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];

      if (row.length >= 9) {
        const semester = parseInt(row[0]);
        const usn = row[1].trim();
        const subjectCode = row[2];
        const subjectName = row[3];
        const externalMarks = parseInt(row[4]);
        const attempt = parseInt(row[5]);
        const passingDate = row[6];
        const cgpa = parseFloat(row[7]);
        const result = row[8].toUpperCase();

        if (!isNaN(semester) && usn && subjectCode && subjectName && !isNaN(externalMarks)) {
          if (!studentGroups.has(usn)) {
            studentGroups.set(usn, new Map());
          }

          const semesterGroups = studentGroups.get(usn);

          if (!semesterGroups.has(semester)) {
            semesterGroups.set(semester, []);
          }

          semesterGroups.get(semester).push({
            subjectCode,
            subjectName,
            externalMarks,
            attempt: isNaN(attempt) ? 1 : attempt,
            passingDate: passingDate || null,
            cgpa: isNaN(cgpa) ? null : cgpa,
            result: result === "PASS" || result === "FAIL" ? result : "FAIL",
          });
        }
      }
    }

    return studentGroups;
  };

  const fetchUserIdByUSN = async (usn) => {
    try {
      const response = await axios.get(`${BASE_URL}/users/usn/${usn}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data?.userId || null;
    } catch (error) {
      console.error(`Error fetching userId for ${usn}`, error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!file) {
      setError("Please select a CSV file");
      setLoading(false);
      return;
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const parsedData = Papa.parse(event.target.result).data;
        const studentGroups = processCSV(parsedData);

        const results = [];

        for (const [usn, semesterGroups] of studentGroups) {
          let studentId = await fetchUserIdByUSN(usn);

          if (!studentId) studentId = user._id;

          for (const [semester, subjects] of semesterGroups) {
            await axios.post(
              `${BASE_URL}/students/external/${studentId}`,
              { semester, subjects },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }

          results.push({ usn, status: "success" });
        }

        setSuccess("Upload successful!");
        setFile(null);
      } catch (err) {
        setError("Error processing CSV");
      }

      setLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4">Upload External Marks</Typography>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Button onClick={downloadTemplate}>Download Template</Button>

          <input type="file" accept=".csv" onChange={handleFileUpload} />

          <Button type="submit" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Upload"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AddMarks;