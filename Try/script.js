document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionTableBody = document.querySelector('#transaction-table tbody');
    const authButton = document.getElementById('auth-button');
    const userStatus = document.getElementById('user-status');
    userStatus.textContent = 'User Panel';
    const modeOfPayment = document.getElementById('mode-of-payment');
    const paymentDetails = document.getElementById('payment-details');

    const paymentInfo = {
        Gcash: 'Gcash Number: 09123456789',
        Maya: 'Maya Number: 09987654321'
    };

    const updatePaymentDetails = () => {
        const selectedPayment = modeOfPayment.value;
        if (selectedPayment === 'Gcash' || selectedPayment === 'Maya') {
            paymentDetails.innerHTML = paymentInfo[selectedPayment];
            paymentDetails.style.display = 'block';
        } else {
            paymentDetails.style.display = 'none';
        }
    };

    modeOfPayment.addEventListener('change', updatePaymentDetails);
    paymentDetails.style.display = 'none';



    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';

    const getTransactions = () => {
        return JSON.parse(localStorage.getItem('transactions')) || [];
    };

    const saveTransactions = (transactions) => {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    };

    const maskPhoneNumber = (phoneNumber) => {
        if (phoneNumber.length > 4) {
            return `${phoneNumber.substring(0, 2)}...${phoneNumber.substring(phoneNumber.length - 2)}`;
        }
        return phoneNumber;
    };

    const renderTransactions = () => {
        const transactions = getTransactions();
        transactionTableBody.innerHTML = '';
        transactions.forEach((transaction, index) => {
            addTransactionToTable(transaction, index);
        });
    };

    const addTransactionToTable = (transaction, index) => {
        const row = document.createElement('tr');

        const phoneNumber = isAdmin ? transaction.phoneNumber : maskPhoneNumber(transaction.phoneNumber);

        const phoneCell = document.createElement('td');
        phoneCell.textContent = phoneNumber;
        row.appendChild(phoneCell);

        const networkCell = document.createElement('td');
        networkCell.textContent = transaction.network;
        row.appendChild(networkCell);

        const mopCell = document.createElement('td');
        mopCell.textContent = transaction.modeOfPayment;
        row.appendChild(mopCell);

        const notesCell = document.createElement('td');
        notesCell.textContent = transaction.notes;
        row.appendChild(notesCell);

        const receiptCell = document.createElement('td');
        receiptCell.classList.add('admin-only');
        if (isAdmin) {
            receiptCell.style.display = 'table-cell';
        }
        receiptCell.innerHTML = transaction.receipt ? `<a href="${transaction.receipt}" target="_blank"><img src="${transaction.receipt}" width="100" alt="Receipt"></a>` : '';
        row.appendChild(receiptCell);

        const statusCell = document.createElement('td');
        if (isAdmin) {
            statusCell.innerHTML = `<select class="status-select" data-index="${index}">
                                        <option value="Pending" ${transaction.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                        <option value="Completed" ${transaction.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                        <option value="Cancelled" ${transaction.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                                    </select>`;
        } else {
            statusCell.textContent = transaction.status;
        }
        row.appendChild(statusCell);

        const actionCell = document.createElement('td');
        actionCell.classList.add('admin-only');
        if (isAdmin) {
            actionCell.style.display = 'table-cell';
            if (transaction.status === 'Completed') {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deleteTransaction(index));
                actionCell.appendChild(deleteButton);
            }
        }
        row.appendChild(actionCell);

        transactionTableBody.appendChild(row);
    };

    const updateStatus = (index, newStatus) => {
        const transactions = getTransactions();
        transactions[index].status = newStatus;
        if (newStatus === 'Completed') {
            transactions[index].completedAt = new Date().getTime();
        } else {
            delete transactions[index].completedAt;
        }
        saveTransactions(transactions);
    };

    const deleteTransaction = (index) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            const transactions = getTransactions();
            transactions.splice(index, 1);
            saveTransactions(transactions);
            renderTransactions();
        }
    };

    transactionTableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('status-select')) {
            const index = e.target.dataset.index;
            const newStatus = e.target.value;
            updateStatus(index, newStatus);
        }
    });

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const phoneNumberInput = document.getElementById('phone-number');
        const notesInput = document.getElementById('notes');
        const networkInput = document.getElementById('network');
        const modeOfPaymentInput = document.getElementById('mode-of-payment');
        const receiptInput = document.getElementById('receipt');

        const phoneNumber = phoneNumberInput.value;
        const notes = notesInput.value;
        const network = networkInput.value;
        const modeOfPayment = modeOfPaymentInput.value;
        const receiptFile = receiptInput.files[0];

        if (phoneNumber) {
            const processTransaction = (receiptData) => {
                const transactions = getTransactions();
                const newTransaction = { phoneNumber, network, notes, status: 'Pending', modeOfPayment, receipt: receiptData };
                transactions.push(newTransaction);
                saveTransactions(transactions);
                addTransactionToTable(newTransaction, transactions.length - 1);

                phoneNumberInput.value = '';
                notesInput.value = '';
                receiptInput.value = '';
            };

            if (receiptFile) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    processTransaction(event.target.result);
                };
                reader.readAsDataURL(receiptFile);
            } else {
                processTransaction(null);
            }
        }
    });

    const checkCompletedTransactions = () => {
        const transactions = getTransactions();
        const twelveHours = 12 * 60 * 60 * 1000;
        const now = new Date().getTime();

        const updatedTransactions = transactions.filter(transaction => {
            if (transaction.status === 'Completed' && transaction.completedAt) {
                if (now - transaction.completedAt > twelveHours) {
                    if (confirm(`Transaction with phone number ${transaction.phoneNumber} is older than 12 hours. Do you want to delete it?`)) {
                        return false;
                    }
                }
            }
            return true;
        });

        saveTransactions(updatedTransactions);
        renderTransactions();
    };

    if (isAdmin) {
        userStatus.textContent = 'Admin Panel';
        authButton.textContent = 'Logout';
        authButton.addEventListener('click', () => {
            sessionStorage.removeItem('isAdmin');
            window.location.reload();
        });
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'table-cell';
        });
        document.querySelector('.form-container').style.display = 'none';
        checkCompletedTransactions();
    } else {
        userStatus.textContent = 'User Panel';
        authButton.textContent = 'Admin Login';
        authButton.addEventListener('click', () => {
            window.location.href = '/Try/login.html';
        });
    }

    renderTransactions();
});