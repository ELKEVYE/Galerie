function FormField({
  label,
  id,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}

export default FormField;
