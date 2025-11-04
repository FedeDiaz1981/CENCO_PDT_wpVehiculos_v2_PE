import * as React from "react";

type DocCardProps = {
  title: string;
  dateLabel?: string;
  dateValue?: string;
  onDateChange?: (v?: string) => void;
  textLabel?: string;
  textValue?: string;
  onTextChange?: (v?: string) => void;
  textAsDropdown?: boolean;
  textOptions?: { key: string; text: string }[];
  file?: File;                 // archivo NUEVO (si el usuario adjunta)
  existingFileName?: string;   // nombre del archivo que ya existe en SP
  onFileChange?: (f?: File) => void;
};

export const DocCard: React.FC<DocCardProps> = ({
  title,
  dateLabel,
  dateValue,
  onDateChange,
  textLabel,
  textValue,
  onTextChange,
  textAsDropdown,
  textOptions,
  file,
  existingFileName, // <-- agregado al destructuring
  onFileChange,
}) => {
  const handleFileChange = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
      const picked = input.files && input.files[0] ? input.files[0] : undefined;
      onFileChange?.(picked);
    };
    input.click();
  };

  // nombre a mostrar: si hay File nuevo, ese; si no, el existente de SP
  const displayedFileName = file ? file.name : (existingFileName || "");

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontWeight: 600 }}>{title}</div>

      {dateLabel && (
        <div>
          <label style={{ fontSize: 13 }}>{dateLabel}</label>
          <input
            type="date"
            value={dateValue || ""}
            onChange={(e) => {
              onDateChange?.(e.target.value);
            }}
            style={{
              width: "100%",
              padding: 6,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>
      )}

      {textLabel && (
        <div>
          <label style={{ fontSize: 13 }}>{textLabel}</label>

          {textAsDropdown ? (
            <select
              value={textValue || ""}
              onChange={(e) => {
                onTextChange?.(e.target.value);
              }}
              style={{
                width: "100%",
                padding: 6,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            >
              <option value="">Seleccione...</option>
              {textOptions?.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.text}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={textValue || ""}
              onChange={(e) => {
                onTextChange?.(e.target.value);
              }}
              style={{
                width: "100%",
                padding: 6,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          )}
        </div>
      )}

      <div>
        <button type="button" onClick={handleFileChange}>
          Adjuntar archivo
        </button>
        {/* Siempre mostramos algo: el nuevo file o el existente (o "-") */}
        <div style={{ fontSize: 12, marginTop: 4 }}>
          {displayedFileName || "-"}
        </div>
      </div>
    </div>
  );
};
