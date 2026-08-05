export const getItemAsync = (key: string) => Promise.resolve(localStorage.getItem(key));
export const setItemAsync = (key: string, value: string) => {
  localStorage.setItem(key, value);
  return Promise.resolve();
};
export const deleteItemAsync = (key: string) => {
  localStorage.removeItem(key);
  return Promise.resolve();
};
