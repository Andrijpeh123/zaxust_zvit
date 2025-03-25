export const generateColorFromUsername = (username: string): string => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const c = (hash & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();
  
  return `#${'00000'.substring(0, 6 - c.length)}${c}`;
};

export const getInitial = (username: string): string => {
  return username.charAt(0).toUpperCase();
};

export const getAvatarColor = (username: string): string => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return `#${"00000".substring(0, 6 - c.length)}${c}`;
};

export const getInitials = (username: string): string => {
  return username.charAt(0).toUpperCase();
};