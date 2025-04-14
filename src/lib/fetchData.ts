const fetchData = async (url: string) => {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        try {
            const data = await response.json();
            return data;
        } catch (parseError: unknown) {
            if (parseError instanceof Error) {
                throw new Error(`Failed to parse JSON response: ${parseError.message}`);
            }
            throw new Error('Failed to parse JSON response');
        }
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`Failed to fetch data: ${String(error)}`);
    }
};

export default fetchData; 