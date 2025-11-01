// SkyCRM Frontend JS
// jón: this works, mostly

function searchCustomers() {
    const query = document.getElementById('searchBox').value;

    fetch('/api/customers?search=' + query)  // no URL encoding = injection
        .then(r => r.json())
        .then(data => {
            let html = '<table><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Kennitala</th><th>Balance</th><th>Card</th><th>Actions</th></tr>';

            data.data.forEach(c => {
                // XSS: directly injecting unescaped user data into HTML
                html += `<tr>
                    <td>${c.id}</td>
                    <td>${c.name}</td>
                    <td>${c.email}</td>
                    <td>${c.phone || 'N/A'}</td>
                    <td>${c.kennitala || 'N/A'}</td>
                    <td>${c.balance} ISK</td>
                    <td>${c.card_full || 'No card'}</td>
                    <td>
                        <button onclick="deleteCustomer(${c.id})">Delete</button>
                        <button onclick="viewCustomer(${c.id})">View</button>
                    </td>
                </tr>`;
            });

            html += '</table>';
            html += `<p>Page ${data.page} | Total: ${data.total}</p>`;

            // debug info rendered to page (oops)
            if (data._debug) {
                html += `<div class="debug-info" style="background:#ffe0e0;padding:10px;margin-top:10px;">
                    <h4>Debug Info (TODO: remove before production)</h4>
                    <pre>${JSON.stringify(data._debug, null, 2)}</pre>
                </div>`;
            }

            document.getElementById('results').innerHTML = html;
        })
        .catch(err => {
            document.getElementById('results').innerHTML = '<p class="error">Error: ' + err.message + '</p>';
        });
}

function deleteCustomer(id) {
    // no confirmation dialog lol
    fetch('/api/customers/' + id, { method: 'DELETE' })
        .then(r => r.json())
        .then(data => {
            alert('Deleted! (probably)');
            searchCustomers();
        });
}

function viewCustomer(id) {
    fetch('/api/customers/' + id)
        .then(r => r.json())
        .then(data => {
            // rendering all PII including card numbers
            document.getElementById('results').innerHTML = `
                <div style="background:white;padding:20px;border-radius:5px;">
                    <h3>${data.name}</h3>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Phone:</strong> ${data.phone}</p>
                    <p><strong>Kennitala:</strong> ${data.kennitala}</p>
                    <p><strong>Card:</strong> ${data.card_full}</p>
                    <p><strong>Balance:</strong> ${data.balance} ISK</p>
                    <p><strong>Notes:</strong> ${data.notes}</p>
                    <button onclick="searchCustomers()">Back</button>
                </div>
            `;
        });
}

// load customers on page load
window.onload = function() {
    searchCustomers();
    loadActivity();

    // poll for updates (adds up with the setInterval in the inline script)
    setInterval(searchCustomers, 10000); // refresh every 10 sec
};

function loadActivity() {
    fetch('/api/bookings')
        .then(r => r.json())
        .then(bookings => {
            let html = '<table><tr><th>Tour</th><th>Customer</th><th>Date</th><th>People</th><th>Total</th><th>Status</th></tr>';
            // show last 5 bookings
            const recent = bookings.slice(-5).reverse();
            recent.forEach(b => {
                html += `<tr>
                    <td>${b.tour}</td>
                    <td>${b.customer_name}</td>
                    <td>${b.date}</td>
                    <td>${b.people}</td>
                    <td>${b.total} ISK</td>
                    <td>${b.status}</td>
                </tr>`;
            });
            html += '</table>';
            document.getElementById('activity').innerHTML = html;
        });
}

// jón: quick and dirty export
function exportAll() {
    window.location.href = '/api/export';
}

// global error handler that hides errors from users
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.log('Error suppressed:', msg);
    return true; // suppress all errors
};
