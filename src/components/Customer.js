import React, { useEffect, useState } from "react";
import { styles } from "../styles/styles";
import { Popup } from './Popup';
import CustomerForm from "./CustomerForm";
import { apiKey, graphql } from "../utils/commons"; // Adjust this to your actual API URL

export default function Customer() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = React.useState(false);
    const [copen, setCOpen] = React.useState(false);
    const [customerId, setCustomerId] = React.useState(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch(graphql, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-hasura-admin-secret": apiKey,
                    },
                    body: JSON.stringify({
                        query:`query fetchcustomer {
                          imsdb_customer {
                            customer_name
                            phone_number
                            address
                            customer_id
                            accounts {
                                balance
                            }
                          }
                        }`
                    })
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                const data = await response.json();
                setCustomers(data.data.imsdb_customer); // Assuming the response structure is similar
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    if (loading) return <div>Loading Customers...</div>;
    if (error) return <div>Error: {error}</div>;

    function fetchCustomerDetails(_customerId) {
        setCOpen(true);
        setCustomerId(_customerId);
    }

    return (
        <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px", marginRight: "10px" }}>
                <button style={styles.button} onClick={() => setOpen(true)}>Add Customer</button>
            </div>
            <Popup openPopup={open} setOpenPopup={setOpen} title="Add Customer">
                <CustomerForm />
            </Popup>
            <Popup openPopup={copen} setOpenPopup={setCOpen} title="Customer Details">
                {/* You can add a component here for displaying detailed customer information */}
            </Popup>

            <div style={styles.gridTable}>
                {/* Table Header */}
                <div style={styles.gridHeader}>
                    <div style={styles.gridHeaderItem}>S. No.</div>
                    <div style={styles.gridHeaderItem}>Customer Name</div>
                    <div style={styles.gridHeaderItem}>Receivable Amount</div>
                    <div style={styles.gridHeaderItem}>Address</div>
                </div>

                {customers.map((customer, index) => (
                    <div style={styles.gridRow} key={index}>
                        <div style={styles.gridCell}>{index + 1}</div>
                        <div
                            style={{
                                ...styles.gridCell,
                                color: "blue",
                                textDecoration: "underline",
                                cursor: "pointer",
                            }}
                            onClick={() => fetchCustomerDetails(customer.customer_id)}
                        >
                            {customer.customer_name}
                        </div>
                        <div style={styles.gridCell}>
                            {customer.accounts?.[0]?.balance != null
                                ? "Rs. " + customer.accounts[0].balance.toLocaleString()
                                : 0}
                        </div>
                        <div style={styles.gridCell}>{customer.address}</div>
                    </div>
                ))}
            </div>
        </>
    );
}