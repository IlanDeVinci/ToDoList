const welcomeSection = document.getElementById("welcomeSection");

// Function to display flash messages
const displayFlashMessage = () => {
	const flashMessage = localStorage.getItem("flashMessage");
	const flashType = localStorage.getItem("flashType"); // e.g., 'success', 'error'

	if (flashMessage) {
		const flashDiv = document.getElementById("flashMessage");
		flashDiv.textContent = flashMessage;

		// Set flash message style based on type
		if (flashType === "success") {
			flashDiv.classList.remove("bg-red-500");
			flashDiv.classList.add("bg-green-500");
		} else if (flashType === "error") {
			flashDiv.classList.remove("bg-green-500");
			flashDiv.classList.add("bg-red-500");
		}

		// Show the flash message
		flashDiv.style.opacity = "1";

		// Automatically hide the flash message after 5 seconds
		setTimeout(() => {
			flashDiv.style.opacity = "0";
			// Remove the flash message from localStorage
			localStorage.removeItem("flashMessage");
			localStorage.removeItem("flashType");
		}, 5000);
	}
};

// New helper function to validate session
const validateSession = async () => {
	const token = localStorage.getItem("token");
	if (!token) return false;

	try {
		const response = await fetch("/api/protected", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		return response.ok;
	} catch (error) {
		console.error("Session validation error:", error);
		return false;
	}
};

// Modified updateUI function
const updateUI = async () => {
	const token = localStorage.getItem("token");
	const firstName = localStorage.getItem("firstName");
	const todoListContainer = document.getElementById("todoListContainer");

	// First, validate the session
	const isSessionValid = await validateSession();
	console.log("Session is valid:", isSessionValid);
	if (!isSessionValid) {
		// Clear all authentication data if session is invalid
		localStorage.removeItem("token");
		localStorage.removeItem("firstName");
		localStorage.removeItem("flashMessage");
		localStorage.removeItem("flashType");

		// Update UI to logged out state
		document.getElementById("authButtons").style.display = "block";
		document.getElementById("userInfo").style.display = "none";
		document.getElementById("taskFormContainer").classList.add("hidden");
		document.getElementById("tasksList").classList.add("hidden");
		todoListContainer.classList.add("hidden");
		welcomeSection.classList.remove("hidden");

		// Set flash message if user was previously logged in
		if (token || firstName) {
			localStorage.setItem(
				"flashMessage",
				"Session expired. Please log in again."
			);
			localStorage.setItem("flashType", "error");
		}
	} else if (token && firstName) {
		// User is authenticated and session is valid
		document.getElementById("authButtons").style.display = "none";
		const userInfo = document.getElementById("userInfo");
		const welcomeMessage = document.getElementById("welcomeMessage");
		welcomeMessage.textContent = `Welcome, ${firstName}!`;
		userInfo.style.display = "flex";
		// Show task form and todo list container
		document.getElementById("taskFormContainer").classList.remove("hidden");
		document.getElementById("tasksList").classList.add("hidden");
		todoListContainer.classList.remove("hidden");
		fetchTasks();
		welcomeSection.classList.add("hidden");
	}

	// Handle existing flash messages
	displayFlashMessage();
};

// Logout function
const logout = () => {
	localStorage.removeItem("token");
	localStorage.removeItem("firstName");
	window.location.reload();
};

// Event listener for logout button
document.getElementById("logoutButton").addEventListener("click", logout);

// Handle Task Form Submission
document.getElementById("taskForm").addEventListener("submit", async (e) => {
	e.preventDefault();

	const title = document.getElementById("taskTitle").value.trim();
	const description = document.getElementById("taskDescription").value.trim();
	const deadlineInput = document.getElementById("taskDeadline").value; // New Deadline Input

	if (!title || !description) {
		// Set a flash message for missing fields
		localStorage.setItem("flashMessage", "Title and description are required.");
		localStorage.setItem("flashType", "error");
		displayFlashMessage();
		return;
	}

	const token = localStorage.getItem("token");

	if (!token) {
		// User is not authenticated
		localStorage.setItem(
			"flashMessage",
			"You must be logged in to create tasks."
		);
		localStorage.setItem("flashType", "error");
		displayFlashMessage();
		return;
	}

	// Prepare the deadline value
	let deadline = null;
	if (deadlineInput) {
		deadline = new Date(deadlineInput).toISOString();
	}

	try {
		const response = await fetch("/api/tasks", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ title, description, deadline }),
		});

		const result = await response.json();

		if (response.ok) {
			// Set a success flash message
			localStorage.setItem("flashMessage", "Task created successfully!");
			localStorage.setItem("flashType", "success");
			// Clear the form
			document.getElementById("taskForm").reset();
			// Fetch and display updated tasks
			fetchTasks();
		} else {
			// Set an error flash message
			localStorage.setItem(
				"flashMessage",
				`Task creation failed: ${result.error}`
			);
			localStorage.setItem("flashType", "error");
			displayFlashMessage();
		}
	} catch (error) {
		console.error("Error creating task:", error);
		// Set an error flash message
		localStorage.setItem(
			"flashMessage",
			"An error occurred while creating the task."
		);
		localStorage.setItem("flashType", "error");
		displayFlashMessage();
	}
	displayFlashMessage();
});

// Function to fetch and display tasks
const fetchTasks = async () => {
	const token = localStorage.getItem("token");

	if (!token) {
		console.warn("Fetch tasks aborted: No token found.");
		document
			.querySelector(".not-logged-in-message")
			?.classList.remove("hidden");
		return;
	}

	try {
		const response = await fetch("/api/tasks", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const result = await response.json();

		if (response.ok) {
			const tasksList = document.getElementById("tasksUl");
			const completedTasksList = document.getElementById("completedTasksUl");

			// Clear existing tasks
			tasksList.innerHTML = "";
			completedTasksList.innerHTML = "";

			// Create empty state messages
			const emptyTasksMessage = `
				 <li class="empty-tasks-message text-center py-8 text-gray-500">
					 <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					 </svg>
					 <p class="text-lg font-medium">No tasks yet</p>
					 <p class="mt-2">Create your first task to get started!</p>
				 </li>
			 `;

			const emptyCompletedTasksMessage = `
				 <li class="empty-completed-tasks-message text-center py-8 text-gray-500">
					 <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					 </svg>
					 <p class="text-lg font-medium">No completed tasks</p>
					 <p class="mt-2">Complete some tasks to see them here!</p>
				 </li>
			 `;

			let hasActiveTasks = false;
			let hasCompletedTasks = false;

			if (result.tasks && result.tasks.length > 0) {
				window.currentTasks = result.tasks;

				result.tasks.forEach((task) => {
					const li = document.createElement("li");
					li.className =
						"bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group";
					li.innerHTML = `
								 <div class="p-5 cursor-pointer">
									 <div class="flex items-center justify-between mb-3">
										 <h3 class="text-lg font-semibold text-gray-800 group-hover:text-purple-600 transition-colors duration-200">${
												task.title
											}</h3>
										 <div class="flex items-center space-x-2">
											 ${
													!task.completed
														? `
											 <button class="edit-button p-2 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors duration-200" data-id="${task.id}">
												 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
												 </svg>
											 </button>
											 <button class="delete-button p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200" data-id="${task.id}">
												 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												 </svg>
											 </button>
										 `
														: ""
												}
										 </div>
									 </div>
									 <p class="text-gray-600 mb-3">${task.description}</p>
									 <div class="flex flex-wrap items-center gap-3">
										 ${
												task.deadline
													? `
											 <div class="flex items-center text-sm text-gray-500">
												 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
												 </svg>
												 ${new Date(task.deadline).toLocaleString()}
											 </div>
										 `
													: ""
											}
										 <label class="flex items-center space-x-2 cursor-pointer">
											 <div class="relative">
												 <input type="checkbox" class="form-checkbox opacity-0 absolute h-5 w-5" ${
														task.completed ? "checked" : ""
													} data-id="${task.id}">
												 <div class="border-2 rounded-md border-gray-300 w-5 h-5 flex flex-shrink-0 justify-center items-center mr-2 ${
														task.completed
															? "bg-green-500 border-green-500"
															: "focus-within:border-green-500"
													}">
													 <svg class="fill-current w-3 h-3 text-white pointer-events-none ${
															task.completed ? "" : "hidden"
														}" viewBox="0 0 20 20">
														 <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
													 </svg>
												 </div>
											 </div>
											 <span class="text-sm text-gray-600">${
													task.completed ? "Completed" : "Mark as Completed"
												}</span>
										 </label>
									 </div>
								 </div>
								 ${
										task.completed
											? `
									 <div class="bg-green-50 px-5 py-2 border-t border-green-100">
										 <span class="text-xs text-green-600">Completed on ${new Date(
												task.completion_date
											).toLocaleString()}</span>
									 </div>
								 `
											: ""
									}
						 `;

					// Add double-click event to view details
					li.addEventListener("dblclick", () => {
						showTaskDetails(task);
					});

					// Event listener for checkbox change
					const checkbox = li.querySelector('input[type="checkbox"]');
					checkbox.addEventListener("change", handleTaskCompletion);

					// Event listeners for Edit and Delete buttons
					const editButton = li.querySelector(".edit-button");
					if (editButton) {
						editButton.addEventListener("click", (e) => {
							e.stopPropagation();
							const taskId = e.currentTarget.getAttribute("data-id");
							handleEditTask(taskId);
						});
					}

					const deleteButton = li.querySelector(".delete-button");
					if (deleteButton) {
						deleteButton.addEventListener("click", (e) => {
							e.stopPropagation();
							const taskId = e.currentTarget.getAttribute("data-id");
							handleDeleteTask(taskId);
						});
					}

					if (task.completed) {
						hasCompletedTasks = true;
						completedTasksList.appendChild(li);
					} else {
						hasActiveTasks = true;
						tasksList.appendChild(li);
					}
				});
			}

			// Show empty state messages if no tasks
			if (!hasActiveTasks) {
				tasksList.innerHTML = emptyTasksMessage;
			}
			if (!hasCompletedTasks) {
				completedTasksList.innerHTML = emptyCompletedTasksMessage;
			}

			// Show the containers
			document.getElementById("tasksList").classList.remove("hidden");
			document.getElementById("completedTasksList").classList.remove("hidden");
		} else {
			console.error("Failed to fetch tasks:", result.error);
			// Display error via flash message
			localStorage.setItem(
				"flashMessage",
				`Failed to fetch tasks: ${result.error}`
			);
			localStorage.setItem("flashType", "error");
			displayFlashMessage();
		}
	} catch (error) {
		console.error("Error fetching tasks:", error);
		// Display error via flash message
		localStorage.setItem(
			"flashMessage",
			"An error occurred while fetching tasks."
		);
		localStorage.setItem("flashType", "error");
		displayFlashMessage();
	}
};

const handleEditTask = (taskId) => {
	// Fetch the task details
	const task = currentTasks.find((t) => t.id === taskId);
	if (!task) {
		alert("Task not found.");
		return;
	}

	// Create edit modal HTML
	const editModal = document.createElement("div");
	editModal.className =
		"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center";
	editModal.id = "editTaskModal";

	editModal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-11/12 max-w-md">
                <h2 class="text-xl font-bold mb-4">Edit Task</h2>
                <form id="editTaskForm" class="space-y-4">
                    <input type="text" id="editTaskTitle" value="${
											task.title
										}" required
                        class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <textarea id="editTaskDescription" rows="4" required
                        class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">${
													task.description
												}</textarea>
                    <input type="datetime-local" id="editTaskDeadline" value="${
											task.deadline
												? new Date(task.deadline).toISOString().slice(0, 16)
												: ""
										}"
                        class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <button type="submit"
                        class="w-full px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none">
                        Save Changes
                    </button>
                </form>
                <button id="closeEditModalButton" class="mt-4 w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                    Cancel
                </button>
            </div>
        `;

	document.body.appendChild(editModal);

	// Event listener to close edit modal
	document
		.getElementById("closeEditModalButton")
		.addEventListener("click", () => {
			editModal.remove();
		});

	// Handle edit form submission
	document
		.getElementById("editTaskForm")
		.addEventListener("submit", async (e) => {
			e.preventDefault();

			const updatedTitle = document
				.getElementById("editTaskTitle")
				.value.trim();
			const updatedDescription = document
				.getElementById("editTaskDescription")
				.value.trim();
			const updatedDeadlineInput =
				document.getElementById("editTaskDeadline").value;

			if (!updatedTitle || !updatedDescription) {
				alert("Title and description are required.");
				return;
			}

			const token = localStorage.getItem("token");
			if (!token) {
				alert("You must be logged in to edit tasks.");
				return;
			}

			let updatedDeadline = null;
			if (updatedDeadlineInput) {
				updatedDeadline = new Date(updatedDeadlineInput).toISOString();
			}

			try {
				const response = await fetch(`/api/tasks/${taskId}`, {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						title: updatedTitle,
						description: updatedDescription,
						deadline: updatedDeadline,
					}),
				});

				const result = await response.json();

				if (response.ok) {
					localStorage.setItem("flashMessage", "Task updated successfully!");
					localStorage.setItem("flashType", "success");
					displayFlashMessage();
					editModal.remove();
					fetchTasks();
				} else {
					localStorage.setItem(
						"flashMessage",
						`Failed to update task: ${result.error}`
					);
					localStorage.setItem("flashType", "error");
					displayFlashMessage();
				}
			} catch (error) {
				console.error("Error updating task:", error);
				localStorage.setItem(
					"flashMessage",
					"An error occurred while updating the task."
				);
				localStorage.setItem("flashType", "error");
				displayFlashMessage();
			}
		});

	// Close modal when clicking outside the content
	editModal.addEventListener("click", (e) => {
		if (e.target === editModal) {
			editModal.remove();
		}
	});
};

// Function to handle task deletion
const handleDeleteTask = async (taskId) => {
	if (!confirm("Are you sure you want to delete this task?")) {
		return;
	}

	const token = localStorage.getItem("token");
	if (!token) {
		alert("You must be logged in to delete tasks.");
		return;
	}

	try {
		const response = await fetch(`/api/tasks/${taskId}`, {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const result = await response.json();

		if (response.ok) {
			localStorage.setItem("flashMessage", "Task deleted successfully!");
			localStorage.setItem("flashType", "success");
			displayFlashMessage();
			fetchTasks();
		} else {
			localStorage.setItem(
				"flashMessage",
				`Failed to delete task: ${result.error}`
			);
			localStorage.setItem("flashType", "error");
			displayFlashMessage();
		}
	} catch (error) {
		console.error("Error deleting task:", error);
		localStorage.setItem(
			"flashMessage",
			"An error occurred while deleting the task."
		);
		localStorage.setItem("flashType", "error");
		displayFlashMessage();
	}
};

// Function to handle task completion toggle
const handleTaskCompletion = async (e) => {
	const taskId = e.target.getAttribute("data-id");
	const completed = e.target.checked;
	const token = localStorage.getItem("token");

	if (!token) {
		localStorage.setItem(
			"flashMessage",
			"You must be logged in to update tasks."
		);
		localStorage.setItem("flashType", "error");
		displayFlashMessage();
		return;
	}

	try {
		const response = await fetch(`/api/tasks/${taskId}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ completed }),
		});

		const result = await response.json();

		if (response.ok) {
			localStorage.setItem(
				"flashMessage",
				`Task marked as ${completed ? "completed" : "incomplete"}!`
			);
			localStorage.setItem("flashType", "success");
			displayFlashMessage();
			fetchTasks(); // Refresh the task lists
		} else {
			localStorage.setItem(
				"flashMessage",
				`Failed to update task: ${result.error}`
			);
			localStorage.setItem("flashType", "error");
			displayFlashMessage();
		}
	} catch (error) {
		console.error("Error updating task:", error);
		localStorage.setItem(
			"flashMessage",
			"An error occurred while updating the task."
		);
		localStorage.setItem("flashType", "error");
		displayFlashMessage();
	}
};

// Function to show task details in a modal
const showTaskDetails = (task) => {
	// Create modal HTML
	const modal = document.createElement("div");
	modal.className =
		"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center";
	modal.id = "taskDetailsModal";

	modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-11/12 max-w-md">
                <h2 class="text-xl font-bold mb-4">Task Details</h2>
                <div class="space-y-4">
                    <div class="bg-purple-50 p-3 rounded-lg border border-purple-100">
                        <p class="font-semibold text-purple-600">Title</p>
                        <p class="text-gray-800">${task.title}</p>
                    </div>
                    <div class="bg-purple-50 p-3 rounded-lg border border-purple-100">
                        <p class="font-semibold text-purple-600">Description</p>
                        <p class="text-gray-800">${task.description}</p>
                    </div>
                    <div class="bg-purple-50 p-3 rounded-lg border border-purple-100">
                        <p class="font-semibold text-purple-600">Deadline</p>
                        <p class="text-gray-800">${
													task.deadline
														? new Date(task.deadline).toLocaleString()
														: "N/A"
												}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-purple-50 p-3 rounded-lg border border-purple-100">
                            <p class="font-semibold text-purple-600">Status</p>
                            <p class="text-gray-800">${
															task.completed
																? '<span class="text-green-500">✓ Completed</span>'
																: '<span class="text-yellow-500">⧖ Pending</span>'
														}</p>
                        </div>
                        <div class="bg-purple-50 p-3 rounded-lg border border-purple-100">
                            <p class="font-semibold text-purple-600">Created</p>
                            <p class="text-gray-800">${new Date(
															task.created_at
														).toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="bg-purple-50 p-3 rounded-lg border border-purple-100">
                        <p class="font-semibold text-purple-600">Completed At</p>
                        <p class="text-gray-800">${
													task.completion_date
														? new Date(task.completion_date).toLocaleString()
														: "Not completed yet"
												}</p>
                    </div>
                </div>
                ${
									!task.completed
										? `
                    <div class="flex space-x-2 mt-4">
                        <button id="editTaskButton" class="w-1/2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Edit</button>
                        <button id="deleteTaskButton" class="w-1/2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
                    </div>
                `
										: ""
								}
                <button id="closeModalButton" 
                        class="mt-6 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg
                               hover:from-purple-600 hover:to-blue-600 transform transition duration-200 
                               hover:scale-[1.02] active:scale-[0.98] font-medium">
                    Close
                </button>
            </div>
            <style>
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-100px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(-50px);
                    }
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out forwards;
                }
            </style>
        `;

	document.body.appendChild(modal);

	// Event listener to close modal
	document.getElementById("closeModalButton").addEventListener("click", () => {
		modal.remove();
	});

	// Event listener for Edit button
	const editButton = document.getElementById("editTaskButton");
	if (editButton) {
		editButton.addEventListener("click", () => {
			modal.remove(); // Close details modal
			handleEditTask(task.id); // Open edit modal
		});
	}

	// Event listener for Delete button
	const deleteButton = document.getElementById("deleteTaskButton");
	if (deleteButton) {
		deleteButton.addEventListener("click", () => {
			modal.remove(); // Close details modal
			handleDeleteTask(task.id); // Trigger delete
		});
	}

	// Close modal when clicking outside the content
	modal.addEventListener("click", (e) => {
		if (e.target === modal) {
			modal.remove();
		}
	});
};
// Update UI on DOM content loaded
document.addEventListener("DOMContentLoaded", updateUI);
