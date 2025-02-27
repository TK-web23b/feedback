document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch('/api/users');
    const users = await response.json();
    const table = document.getElementById('usersTable');

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.fullname}</td>
            <td>${user.email}</td>
            <td>${user.customer_id}</td>
            <td>${user.admin ? 'Yes' : 'No'}</td>
        `;
        table.appendChild(row);
    });
});
