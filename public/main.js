let inventory = JSON.parse(localStorage.getItem('inventory')) || [];

function clearInputs(form) {
  form.querySelectorAll('input').forEach(input => input.value = '');
  form.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
}

function addProduct() {
  const name = document.getElementById('product-name').value;
  const category = document.getElementById('product-category').value;
  const stock = parseInt(document.getElementById('product-stock').value);
  const description = document.getElementById('product-description').value;

  if (name && category && stock >= 0 && description) {
    inventory.push({ name, category, stock, description });
    localStorage.setItem('inventory', JSON.stringify(inventory));
    renderTable();
    alert('Product added successfully!');
    clearInputs(document.querySelector('.form-section'));
  } else {
    alert('Please fill all fields correctly!');
  }
}

function updateStock() {
  const name = document.getElementById('sale-product-name').value;
  const quantity = parseInt(document.getElementById('sale-quantity').value);

  const product = inventory.find(item => item.name === name);
  if (product) {
    if (product.stock >= quantity) {
      product.stock -= quantity;
      localStorage.setItem('inventory', JSON.stringify(inventory));
      renderTable();
      alert('Stock updated successfully!');
      clearInputs(document.querySelector('.form-section'));
    } else {
      alert('Not enough stock!');
    }
  } else {
    alert('Product not found!');
  }
}

function deleteProduct(index) {
  if (confirm('Are you sure you want to delete this product?')) {
    inventory.splice(index, 1);
    localStorage.setItem('inventory', JSON.stringify(inventory));
    renderTable();
  }
}

function renderTable() {
  const tableBody = document.getElementById('product-table');
  tableBody.innerHTML = '';

  inventory.forEach((product, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.name}</td>
      <td>${product.category}</td>
      <td>${product.stock}</td>
      <td>${product.description}</td>
      <td>
        <button onclick="deleteProduct(${index})">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', renderTable);
