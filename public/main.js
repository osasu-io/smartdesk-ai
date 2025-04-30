// === Function to mark a todo item as done ===
function markDone(id) {
  // Send a PUT request to /todos with the item's ID
  fetch('/todos', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' }, // Tell server we're sending JSON
    body: JSON.stringify({ id: id }) // Send the ID in the request body
  })
  .then(response => {
    // If the server responds OK, parse the response JSON
    if (response.ok) return response.json();
  })
  .then(data => {
    console.log(data); // Log response data (optional for debugging)
    window.location.reload(); // Refresh the page to show updated state
  })
  .catch(err => console.error(err)); // Handle any errors
}

// === Function to delete a todo item ===
function deleteTodo(id) {
  // Send a DELETE request to /todos with the item's ID
  fetch('/todos', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id })
  })
  .then(response => {
    if (response.ok) return response.json();
  })
  .then(data => {
    console.log(data); // Log the response
    window.location.reload(); // Refresh the page after deletion
  })
  .catch(err => console.error(err)); // Log any errors
}

// === Event listeners setup (runs after DOM is fully loaded) ===
document.addEventListener('DOMContentLoaded', () => {
  // For each "mark done" button, add a click event listener
  document.querySelectorAll('.mark-done-btn').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.id; // Get the to-do ID from data-id attribute
      markDone(id); // Call the markDone function with this ID
    });
  });

  // For each "delete" button, add a click event listener
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.id; // Get the to-do ID from data-id attribute
      deleteTodo(id); // Call the deleteTodo function
    });
  });
});
