import supabase from "./utils/init.js";

export const registerUser = async (
	email: string,
	password: string,
	firstName: string,
	lastName: string
) => {
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: {
				first_name: firstName,
				last_name: lastName,
			},
		},
	});

	if (error) {
		console.error("Registration error:", error);
		throw error;
	}

	return data;
};
