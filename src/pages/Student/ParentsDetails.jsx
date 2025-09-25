import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useSnackbar } from "notistack";
import api from "../../utils/axios";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Box, Grid, Card, Stack, Typography, Divider } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  FormProvider,
  RHFTextField,
} from "../../components/hook-form";

const DEFAULT_VALUES = {
  fatherFirstName: "",
  fatherMiddleName: "",
  fatherLastName: "",
  motherFirstName: "",
  motherMiddleName: "",
  motherLastName: "",
  fatherOccupation: "",
  motherOccupation: "",
  fatherOrganization: "",
  motherOrganization: "",
  fatherDesignation: "",
  motherDesignation: "",
  fatherOfficeAddress: "",
  motherOfficeAddress: "",
  fatherAnnualIncome: "",
  motherAnnualIncome: "",
  fatherOfficePhone: "",
  motherOfficePhone: "",
  fatherResidencePhone: "",
  motherResidencePhone: "",
  fatherEmail: "",
  motherEmail: "",
  mobileNumber: "",
  residenceAddress: "",
  fax: "",
  district: "",
  taluka: "",
  village: "",
  state: "",
  pincode: "",
};

export default function ParentsDetails() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const menteeId = searchParams.get('menteeId');
  const [isDataFetched, setIsDataFetched] = useState(false);

  const methods = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
    setValue,
  } = methods;

  const fetchParentDetails = useCallback(async () => {
    try {
      const userId = menteeId || user?._id;
      if (!userId) {
        console.error('No userId available for fetching data');
        return;
      }
      
      const response = await api.get(`/parent-details/${userId}`);
      console.log("Parent details full response:", JSON.stringify(response.data, null, 2));
      
      // Extract parent details - check multiple possible response structures
      let parentDetails = null;
      
      if (response.data?.data?.parentDetails) {
        parentDetails = response.data.data.parentDetails;
        console.log("Found data in response.data.data.parentDetails");
      } else if (response.data?.parentDetails) {
        parentDetails = response.data.parentDetails;
        console.log("Found data in response.data.parentDetails");
      } else if (response.data?.data) {
        parentDetails = response.data.data;
        console.log("Found data in response.data.data");
      } else {
        parentDetails = response.data;
        console.log("Using data directly from response.data");
      }
      
      console.log("Extracted parent details:", parentDetails);
      
      if (parentDetails) {
        // Prepare form data with only DEFAULT_VALUES keys
        const formData = { ...DEFAULT_VALUES };
        Object.keys(DEFAULT_VALUES).forEach((key) => {
          formData[key] = parentDetails[key] || "";
        });

        console.log("Final formData to reset:", formData);
        reset(formData);
        setIsDataFetched(true);
      }
    } catch (error) {
      console.error("Error fetching parent details:", error);
    }
  }, [user?._id, menteeId, reset, enqueueSnackbar]);

  useEffect(() => {
    fetchParentDetails();
  }, [fetchParentDetails]);

  const onSubmit = async (formData) => {
    try {
      const userId = menteeId || user?._id;
      if (!userId) {
        enqueueSnackbar("User ID is required", { variant: "error" });
        return;
      }
      
      console.log("Form data:", formData);
      const requestData = {
        ...formData,
        userId,
      };
      
      console.log("Sending data with userId:", requestData);
      const response = await api.post("/parent-details", requestData);
      
      enqueueSnackbar("Parent details saved successfully!", {
        variant: "success",
      });
    } catch (error) {
      console.error("Error saving parent details:", error);
      const errorMessage = error.response?.data?.message || error.message || "An error occurred while saving parent details";
      enqueueSnackbar(errorMessage, { variant: "error" });
    }
  };

  return (
    <div>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>Parents Details</Typography>
              <Divider sx={{ mb: 3 }} />
              
              {!isDataFetched ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography>Loading parent details...</Typography>
                </Box>
              ) : (
                <>
                  
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <RHFTextField
                        name="fatherFirstName"
                        label="Father's First Name"
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <RHFTextField
                        name="fatherMiddleName"
                        label="Father's Middle Name"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <RHFTextField
                        name="fatherLastName"
                        label="Father's Last Name"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <RHFTextField
                        name="motherFirstName"
                        label="Mother's First Name"
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <RHFTextField
                        name="motherMiddleName"
                        label="Mother's Middle Name"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <RHFTextField
                        name="motherLastName"
                        label="Mother's Last Name"
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </Card>
          </Grid>

          {isDataFetched && (
            <>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Stack spacing={3} sx={{ mt: 1}}>
                    <Typography variant="h6">Father's Details</Typography>
                    <RHFTextField
                      name="fatherOccupation"
                      label="Father's Occupation"
                      fullWidth
                      required
                    />
                    <RHFTextField
                      name="fatherOrganization"
                      label="Father's Organization"
                      fullWidth
                    />
                    <RHFTextField
                      name="fatherDesignation"
                      label="Father's Designation"
                      fullWidth
                    />
                    <RHFTextField
                      name="fatherOfficePhone"
                      label="Father's Office Phone No."
                      fullWidth
                      required
                    />
                    <RHFTextField
                      name="fatherOfficeAddress"
                      label="Father's Office Address"
                      fullWidth
                    />
                    <RHFTextField
                      name="fatherAnnualIncome"
                      label="Father's Annual Income"
                      fullWidth
                    />
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3 }}>
                  <Stack spacing={3} sx={{ mt: 1}}>
                    <Typography variant="h6">Mother's Details</Typography>
                    <RHFTextField
                      name="motherOccupation"
                      label="Mother's Occupation"
                      fullWidth
                      required
                    />
                    <RHFTextField
                      name="motherOrganization"
                      label="Mother's Organization"
                      fullWidth
                    />
                    <RHFTextField
                      name="motherDesignation"
                      label="Mother's Designation"
                      fullWidth
                    />
                    <RHFTextField
                      name="motherOfficePhone"
                      label="Mother's Phone No."
                      fullWidth
                      required
                    />
                    <RHFTextField
                      name="motherOfficeAddress"
                      label="Mother's Office Address"
                      fullWidth
                    />
                    <RHFTextField
                      name="motherAnnualIncome"
                      label="Mother's Annual Income"
                      fullWidth
                    />
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} md={12}>
                <Card sx={{p:3}}>
                  <Stack spacing={3} alignItems="flex-end" >
                    <Box display="flex" gap={1}>
                      <LoadingButton
                        type="submit"
                        variant="contained"
                        loading={isSubmitting}
                      >
                        Save
                      </LoadingButton>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </FormProvider>
    </div>
  );
}
