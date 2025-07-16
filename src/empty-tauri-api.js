// Mock for @tauri-apps/api/storage for web/dev environments
export const get = async (key) => {
  console.log('Mock storage get:', key);
  return localStorage.getItem(key);
};

export const set = async (key, value) => {
  console.log('Mock storage set:', key, value);
  localStorage.setItem(key, value);
};

export const remove = async (key) => {
  console.log('Mock storage remove:', key);
  localStorage.removeItem(key);
};

export const clear = async () => {
  console.log('Mock storage clear');
  localStorage.clear();
};

export default {
  get,
  set,
  remove,
  clear
}; 