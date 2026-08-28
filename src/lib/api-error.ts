export async function extractErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) {
    return "Something went wrong. Please try again.";
  }

  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data.join(" ");
    }
    if (data.errors) {
      return Object.values(data.errors).flat().join(" ");
    }
  } catch {
    return text;
  }

  return "Something went wrong. Please try again.";
}
