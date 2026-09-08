"use client";

import React, { useEffect } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import InputField from "../../custom/inputfield";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCompleteProfile, CompleteProfileResponse, CompleteProfilePayload } from "@/mutations/auth/useAuthMutations";
import { COUNTRIES } from "@/constants/countries";
import { getUserCountry, getCountryIsoFromName } from "@/lib/location";
import { toast } from "sonner";

const profileSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    gender: z.enum(["male", "female", "other"]),
    date_of_birth: z.string().min(1, "Date of birth is required"),
    country_iso: z.string().min(1, "Country is required"),
    mobile_no: z.string().min(6, "Valid mobile number is required"),
    is_existing_patient: z.enum(["yes", "no"]),
    existing_patient_id: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.is_existing_patient === "yes") {
        return !!data.existing_patient_id && data.existing_patient_id.trim().length > 0;
      }
      return true;
    },
    {
      message: "Patient ID is required",
      path: ["existing_patient_id"],
    }
  );

type ProfileValues = z.infer<typeof profileSchema>;

interface CompleteProfileStepProps {
  email: string;
}

const CompleteProfileStep: React.FC<CompleteProfileStepProps> = ({ email }) => {
  const router = useRouter();
  const { mutate: completeProfile, isPending } = useCompleteProfile();

  const methods = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: email,
      password: "",
      first_name: "",
      last_name: "",
      gender: "male",
      date_of_birth: "",
      country_iso: "IN",
      mobile_no: "",
      is_existing_patient: "no",
      existing_patient_id: "",
    },
  });

  const isExistingPatient = methods.watch("is_existing_patient");
  const selectedCountryIso = methods.watch("country_iso");
  const selectedCountry = COUNTRIES.find((c) => c.iso === selectedCountryIso) || COUNTRIES[0];

  // Auto-detect current location country on mount
  useEffect(() => {
    getUserCountry().then((detectedCountry) => {
      const iso = getCountryIsoFromName(detectedCountry);
      if (iso) {
        methods.setValue("country_iso", iso);
      }
    });
  }, [methods]);

  // Clear existing_patient_id if user switches to "no"
  useEffect(() => {
    if (isExistingPatient === "no") {
      methods.setValue("existing_patient_id", "");
    }
  }, [isExistingPatient, methods]);

  // Prefill email if it changes
  useEffect(() => {
    if (email) {
      methods.setValue("email", email);
    }
  }, [email, methods]);

  const onSubmit = async (data: ProfileValues) => {
    const { is_existing_patient, existing_patient_id, country_iso, ...rest } = data;
    const isExisting = is_existing_patient === "yes";
    const countryObj = COUNTRIES.find((c) => c.iso === country_iso) || COUNTRIES[0];

    const currentLocation = await getUserCountry(countryObj.name);

    const payload: CompleteProfilePayload = {
      ...rest,
      country_iso: countryObj.iso,
      country_code: countryObj.code,
      current_location: currentLocation,
      is_existing_patient: isExisting ? 1 : 0,
      existing_patient_id: isExisting ? (existing_patient_id || "") : "",
    };

    completeProfile(payload, {
      onSuccess: (response: CompleteProfileResponse) => {
        if (response.success) {
          toast.success(response.message || "Profile completed successfully!");
          router.push("/dashboard");
        } else {
          toast.error(response?.errors?.message || response.message || "Failed to complete profile.");
        }
      },
      onError: (err: any) => {
        const responseData = err?.response?.data || {};
        toast.error(responseData?.errors?.message || responseData?.message || err?.message || "Profile completion failed");
      },
    });
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1 pr-2">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5 pb-4">
          <InputField
            name="email"
            label="Email Address"
            placeholder="example@mail.com"
            required
            disabled={true} // Email is verified and locked
            type="email"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              name="first_name"
              label="First Name"
              placeholder="First Name"
              required
              disabled={isPending}
            />
            <InputField
              name="last_name"
              label="Last Name"
              placeholder="Last Name"
              required
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Gender *</label>
              <select
                {...methods.register("gender")}
                disabled={isPending}
                className="flex h-10 w-full rounded-md border border-input bg-accent/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <InputField
              name="date_of_birth"
              label="Date of Birth"
              type="date"
              required
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-muted-foreground font-source-sans">
                Country <span className="text-destructive font-semibold ml-0.5">*</span>
              </label>
              <select
                {...methods.register("country_iso")}
                disabled={isPending}
                className="flex h-10 w-full rounded-md border border-input bg-accent/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 font-source-sans"
              >
                {COUNTRIES.map((country) => (
                  <option key={country.iso} value={country.iso}>
                    {country.flag} {country.name} ({country.code})
                  </option>
                ))}
              </select>
            </div>

            <InputField
              name="mobile_no"
              label="Mobile Number"
              placeholder={selectedCountry ? `${selectedCountry.code} 7325809632` : "7325809632"}
              required
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              name="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
            />

            <div className="flex flex-col space-y-2">
              <label className="font-source-sans text-muted-foreground text-sm font-medium">
                Is Existing Patient? <span className="text-destructive font-semibold ml-0.5">*</span>
              </label>
              <Controller
                name="is_existing_patient"
                control={methods.control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-row gap-6 pt-1.5"
                    disabled={isPending}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="existing_patient_yes" />
                      <label htmlFor="existing_patient_yes" className="cursor-pointer text-sm font-medium text-foreground">
                        Yes
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="existing_patient_no" />
                      <label htmlFor="existing_patient_no" className="cursor-pointer text-sm font-medium text-foreground">
                        No
                      </label>
                    </div>
                  </RadioGroup>
                )}
              />
            </div>
          </div>

          {isExistingPatient === "yes" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                name="existing_patient_id"
                label="Patient ID"
                placeholder="Enter Patient ID"
                required
                disabled={isPending}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2.5 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-source-sans mt-4"
          >
            {isPending ? "Saving Profile..." : "Complete Registration"}
          </button>
        </form>
      </FormProvider>
    </div>
  );
};

export default CompleteProfileStep;
