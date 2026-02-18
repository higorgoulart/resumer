import { useCallback, useState } from "react";

const STORAGE_KEY = "ATS_ANALYZER_API_KEY";
const SALT = "ats:v1";

export function useApiKey() {
  const encode = (value: string) => btoa(`${SALT}:${value}`);

	const decode = (value: string) => {
		try {
			const decoded = atob(value);
			if (!decoded.startsWith(`${SALT}:`)) return "";
			return decoded.replace(`${SALT}:`, "");
		} catch {
			return "";
		}
	};

  const [apiKey, setApiKeyState] = useState(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? decode(stored) : "";
  });

  const setApiKey = useCallback(
    (value: string) => {
      setApiKeyState(value);

      if (!value) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }

      sessionStorage.setItem(STORAGE_KEY, encode(value));
    },
    [sessionStorage]
  );

  return {
    apiKey,
    setApiKey
  };
}
