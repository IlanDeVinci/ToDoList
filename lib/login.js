import supabase from "./utils/init.js";
// Function to log in a user
export const loginUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        console.error("Login error:", error);
        throw error;
    }
    return data;
};
