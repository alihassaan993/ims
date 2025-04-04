import React, {useEffect, useState} from "react";
import {apiKey, graphql} from "../utils/commons";
import {styles} from "../styles/styles";

export default function SupplierTransactions(props) {
    const {supplierId}= props;
    const [refresh,setRefresh] = useState(false);
    const [transactions,setTransactions] = useState([]);
    const [loading,setLoading] = useState(false);
    const [error,setError] = useState(false);

    useEffect(() => {
        const fetchSupplierTransactions = async () => {
            try {
                const response = await fetch(graphql, {
                    method: "POST", // or "POST" depending on your API
                    headers: {
                        "Content-Type": "application/json",
                        "x-hasura-admin-secret": apiKey
                    },
                    body: JSON.stringify({
                        method: "POST",
                        query:`query fetchSupplierTransactions($supplierId: Int!){
                          imsdb_supplier(where: {supplier_id: {_eq: $supplierId}}) {
                            accounts {
                              balance
                              account_transactions(order_by: {transaction_date: desc}) {
                                amount
                                narration
                                transaction_date
                                transaction_reference
                                transaction_type
                              }
                            }
                          }
                        }
                        `,variables: {supplierId: supplierId}
                    })
                });
                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                const data  = await response.json();
                console.log("API Response:", data);

                // Ensure imsdb_inventory exists in the response
                if (data.data && data.data.imsdb_supplier) {
                    setTransactions(data.data.imsdb_supplier[0].accounts[0].account_transactions);
                } else {
                    setError("Supplier transactions not found.");
                }

                setLoading(false);
            }catch (e) {
                console.error("Error while fetching supplier Transactions " + e);
            }
            }
        fetchSupplierTransactions();
        }, [refresh]);

    if (loading) return <div>Loading Supplier Transactions...</div>;
    if (error) return <div>Error: {error}</div>;

    return(
        <>
            <div style={styles.gridTable}>
                {/* Table Header */}
                <div style={styles.gridSuppHeader}>
                    <div style={styles.gridHeaderItem}>S. No.</div>
                    <div style={styles.gridHeaderItem}>Transaction Reference</div>
                    <div style={styles.gridHeaderItem}>Date</div>
                    <div style={styles.gridHeaderItem}>Transaction Type</div>
                    <div style={styles.gridHeaderItem}>Amount</div>
                    <div style={styles.gridHeaderItem}>Narration</div>

                </div>

                {/* Transaction Data */}
                {transactions.map((transaction, index) => (
                    <div style={styles.gridSuppRow} key={index}>
                        <div style={styles.gridCell}>{index + 1}</div>
                        <div style={styles.gridCell}>{transaction.transaction_reference}</div>
                        <div style={styles.gridCell}>{transaction.transaction_date}</div>
                        <div style={styles.gridCell}>{transaction.transaction_type}</div>
                        <div style={styles.gridCell}>Rs. {transaction.amount.toLocaleString()}</div>
                        <div style={styles.gridCell}>{transaction.narration}</div>
                    </div>
                ))}
            </div>
        </>
    )
}