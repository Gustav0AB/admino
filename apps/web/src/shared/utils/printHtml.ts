type PrintOptions = { html: string; base64?: boolean };

export const printToFileAsync = async ({ html }: PrintOptions) => {
  const blob = new Blob([html], { type: "text/html" });
  return { uri: URL.createObjectURL(blob) };
};

export const printAsync = async ({ html }: PrintOptions) => {
  const frame = document.createElement("iframe");
  frame.style.display = "none";
  document.body.appendChild(frame);
  frame.contentDocument?.write(html);
  frame.contentDocument?.close();
  frame.contentWindow?.print();
  frame.remove();
};
