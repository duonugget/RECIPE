document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('infoForm');
    const notification = document.getElementById('notification');

    form.addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent the default form submission

        // Collect form data
        const age = document.getElementById('age').value;
        const weight = document.getElementById('weight').value;
        const height = document.getElementById('height').value;
        const activityLevel = document.getElementById('activity_level').value;
        const userID = sessionStorage.getItem('userID');
        console.log(age, weight, height, activityLevel, userID);

        // Send a POST request to the server
        fetch('http://localhost:3000/saving', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ age, weight, height, activityLevel, userID })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(responseText => {
                notification.textContent = 'Changes saved successfully'; // Set notification text
                notification.style.display = 'block';
                console.log(responseText); // Print response from server
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
            });

    });
});
