import { TextField, type TextFieldProps } from "@mui/material";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

type Props<TFieldValues extends FieldValues> = Omit<TextFieldProps, "name" | "defaultValue"> & {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
};

export function RHFTextField<TFieldValues extends FieldValues>({ control, name, helperText, ...props }: Props<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
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

