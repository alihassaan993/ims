import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import {apiKey, companyID, addProductURL, graphql} from '../utils/commons';


export default function Supplier(props) {
    const {supplierId,balance} = props;
    const [amount, setAmount] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
    const [narration, setNarration] = useState('');

    // Handle input change
    const handleAmountChange = (e) => {
        setAmount(e.target.value);
    };
    const handleTransactionDateChange = (e) => {
        setTransactionDate(e.target.value);
    };
    const handleNarrationChange = (e) => {
        setNarration(e.target.value);
    };
    // Handle add button click
    const handleAddPayment = async () => {
        if (!amount || !transactionDate) {
            alert("Please provide payment amount and transaction date");
            return;
        }

        try {
            // Fetching Account ID and Current Balance
            let accountResponse = await fetch(graphql, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                body: JSON.stringify({
                    query: `query getAccountId($supplierId: Int!) {
                    imsdb_account(where: { supplier_id: { _eq: $supplierId } }) {
                        account_id
                        balance
                    }
                }`,
                    variables: { supplierId },
                }),
            });

            let accountData = await accountResponse.json();
            let account = accountData.data.imsdb_account[0];
            if (!account) {
                alert("No account found for the supplier.");
                return;
            }

            let accountId = account.account_id;
            let updatedBalance = account.balance - parseFloat(amount); // Deduct payment

            // Execute GraphQL Mutation for Transaction and Balance Update
            const response = await fetch(graphql, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hasura-admin-secret': apiKey,
                },
                body: JSON.stringify({
                    query: `mutation addTransaction(
                    $accountId: Int!,
                    $amount: Int!,
                    $transactionDate: date!,
                    $updatedBalance: Int!,
                    $narration: String!,
                ) {
                    insert_imsdb_account_transaction(
                        objects: {
                            account_id: $accountId,
                            amount: $amount,
                            transaction_date: $transactionDate,
                            transaction_type: "DEBIT",
                            narration: $narration
                        }
                    ) {
                        affected_rows
                    }

                    update_imsdb_account_by_pk(
                        pk_columns: { account_id: $accountId },
                        _set: { balance: $updatedBalance }
                    ) {
                        balance
                    }
                }`,
                    variables: {
                        accountId,
                        amount: parseFloat(amount),  // Ensure numeric value
                        transactionDate,
                        updatedBalance,
                        narration
                    },
                }),
            });

            const data = await response.json();
            if (response.ok && data.data) {
                console.log('Payment added successfully:', data);
                setAmount('');
                setTransactionDate('');
            } else {
                alert("Failed to add payment!");
                console.error('Error:', data);
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    };

    // Handle clear button click
    const handleClear = () => {
        setAmount('');
        setNarration('');
    };

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',  // Fixed invalid value
                    gap: 2,  // Adds space between items
                    padding: 2,
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                }}
            >
                <TextField
                    label="Payment Amount"
                    value={amount}
                    onChange={handleAmountChange}
                    type="number"
                    required
                />
                <TextField
                    type="date"
                    name="transactionDate"
                    label="Transaction Date"
                    value={transactionDate}
                    onChange={handleTransactionDateChange}
                    required
                />
            </Box>
        <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            margin: '1 auto',
            marginTop: '1rem',
            padding: 2,
            border: '1px solid #ccc',
            borderRadius: '8px',
        }}>
            <TextField fullWidth type="text" label="Narration"
                       name="narration"
                       value={narration}
                       onChange={handleNarrationChange}
                       required />
        </Box>
        <Box sx={{ display: 'flex',
            justifyContent: 'space-between', width: '100%',marginTop:1 }}>
            <Button
                variant="contained"
                color="primary"
                onClick={handleAddPayment}
                sx={{ marginRight: 1 }}
            >
                Add
            </Button>
            <Button
                variant="outlined"
                color="secondary"
                onClick={handleClear}
            >
                Clear
            </Button>
        </Box>
        </Box>
    );
}