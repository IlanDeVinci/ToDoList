import supabase from "../utils/init.js";

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

	if (error) throw error;
	return data;
};

export const loginUser = async (email: string, password: string) => {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) throw error;
	return data;
};
