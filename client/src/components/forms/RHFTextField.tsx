import { TextField, type TextFieldProps } from "@mui/material";
import { Controller } from "react-hook-form";

type Props = Omit<TextFieldProps, "name" | "defaultValue"> & {
  control: any;
  name: string;
};

export function RHFTextField({ control, name, helperText, ...props }: Props) {
  return (
    <Controller
      control={control}
      name={name as any}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          {...field}
          value={field.value ?? ""}
          error={props.error ?? Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
        />
      )}
    />
  );
}

