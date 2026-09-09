const input = document.getElementById("noteInput");
const button = document.getElementById("addButton");
const notes = document.getElementById("notes");

let token = null;

const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");

const registerButton = document.getElementById("registerButton");
const loginButton = document.getElementById("loginButton");

console.log("Script");


// Takes no arguments.
// Creates a new note for the logged-in user.
button.addEventListener("click", function() {

    if (!token) {
        return;
    }

    if (input.value === "") {
        return;
    }

    axios.post("http://localhost:5000/notes", {
        text: input.value
    }, {
        headers: {
            Authorization: "Bearer " + token
        }
    })
        .then(function(response) {

            const note = document.createElement("p");

            note.innerText = response.data.text;

            const deleteButton = document.createElement("button");

            deleteButton.innerText = "Delete";

            deleteButton.addEventListener("click", function() {

                axios.delete(
                    "http://localhost:5000/notes/" + response.data._id,
                    {
                        headers: {
                            Authorization: "Bearer " + token
                        }
                    }
                )
                    .then(function() {
                        note.remove();
                    })
                    .catch(function(error) {
                        console.log(error);
                    });
            });

            note.appendChild(deleteButton);

            notes.appendChild(note);

            input.value = "";

            console.log(response.data);
        })
        .catch(function(error) {

            console.log(error);

        });
});


// Takes no arguments.
// Registers a new user with the username and password entered by the user.
registerButton.addEventListener("click", function() {

    axios.post("http://localhost:5000/register", {
        username: usernameInput.value,
        password: passwordInput.value
    })
        .then(function(response) {

            console.log(response.data);

        })
        .catch(function(error) {

            console.log(error);

        });
});


// Takes no arguments.
// Logs the user in and stores the JWT returned by the backend.
loginButton.addEventListener("click", function() {

    axios.post("http://localhost:5000/login", {
        username: usernameInput.value,
        password: passwordInput.value
    })
        .then(function(response) {

            console.log(response.data);

            token = response.data.token;

            notes.innerHTML = "";

            const message = document.createElement("p");
            message.innerText = "User logged in";

            document.body.appendChild(message);


            axios.get("http://localhost:5000/notes", {
                headers: {
                    Authorization: "Bearer " + token
                }
            })
                .then(function(response) {

                    response.data.forEach(function(note) {

                        const noteElement = document.createElement("p");

                        noteElement.innerText = note.text;


                        const deleteButton = document.createElement("button");

                        deleteButton.innerText = "Delete";


                        const editButton = document.createElement("button");

                        editButton.innerText = "Edit";


                        deleteButton.addEventListener("click", function() {

                            axios.delete(
                                "http://localhost:5000/notes/" + note._id,
                                {
                                    headers: {
                                        Authorization: "Bearer " + token
                                    }
                                }
                            )
                                .then(function() {

                                    noteElement.remove();

                                })
                                .catch(function(error) {

                                    console.log(error);

                                });
                        });


                        editButton.addEventListener("click", function() {

                            const ok = document.createElement("button");

                            ok.innerText = "ok";

                            noteElement.appendChild(ok);


                            ok.addEventListener("click", function() {

                                note.text = input.value;

                                axios.put(
                                    "http://localhost:5000/notes/" + note._id,
                                    {
                                        text: input.value
                                    },
                                    {
                                        headers: {
                                            Authorization: "Bearer " + token
                                        }
                                    }
                                )
                                    .then(function(response) {

                                        noteElement.firstChild.textContent =
                                            input.value;

                                        ok.remove();

                                        input.value = "";

                                    })
                                    .catch(function(error) {

                                        console.log(error);

                                    });

                            });

                        });


                        noteElement.appendChild(deleteButton);

                        noteElement.appendChild(editButton);

                        notes.appendChild(noteElement);

                    });

                })
                .catch(function(error) {

                    console.log(error);

                });

        })
        .catch(function(error) {

            const message = document.createElement("p");

            message.innerText = error.response.data.message;

            document.body.appendChild(message);

            console.log(error);

        });

});