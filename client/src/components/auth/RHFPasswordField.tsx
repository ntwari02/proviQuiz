import { useMemo, useState } from "react";
import { Alert, IconButton, InputAdornment } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import type { Control, FieldValues, Path } from "react-hook-form";
import { RHFTextField } from "../forms/RHFTextField";

type Props<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  autoComplete?: string;
  disabled?: boolean;
  showCapsLockHint?: boolean;
};

export function RHFPasswordField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  autoComplete,
  disabled,
  showCapsLockHint = true,
}: Props<TFieldValues>) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const endAdornment = useMemo(
    () => (
      <InputAdornment position="end">
        <IconButton
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
          edge="end"
        >
          {visible ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
        </IconButton>
      </InputAdornment>
    ),
    [visible]
  );

  return (
    <>
      <RHFTextField
        control={control}
        name={name}
        label={label}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        disabled={disabled}
        fullWidth
        onKeyDown={(e) => {
          if (showCapsLockHint) setCapsLock(e.getModifierState?.("CapsLock") ?? false);
        }}
        InputProps={{ endAdornment }}
      />
      {showCapsLockHint && capsLock && (
        <Alert severity="warning" sx={{ mt: 1, borderRadius: 2 }}>
          Caps Lock is on.
        </Alert>
      )}
    </>
  );
}

