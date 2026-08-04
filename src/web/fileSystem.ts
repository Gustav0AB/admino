export const documentDirectory = "";
export const writeAsStringAsync = async (uri: string, contents: string) => {
  localStorage.setItem(uri, contents);
};
