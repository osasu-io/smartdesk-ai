// main.js

function markDone(id) {
  fetch('/todos', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id })
  })
  .then(response => {
    if (response.ok) return response.json();
  })
  .then(data => {
    console.log(data);
    window.location.reload();
  })
  .catch(err => console.error(err));
}

function deleteTodo(id) {
  fetch('/todos', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: id })
  })
  .then(response => {
    if (response.ok) return response.json();
  })
  .then(data => {
    console.log(data);
    window.location.reload();
  })
  .catch(err => console.error(err));
}

// Attach listeners when the page loads
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.mark-done-btn').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      markDone(id);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      deleteTodo(id);
    });
  });
});
