import React, { useState } from 'react';
import { apiKey, graphql } from "../utils/commons"; // Adjust this to your actual API URL

export default function CustomerForm() {
    const [customerName, setCustomerName] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const mutation = `
      mutation addcustomer($address: String!, $customer_name: String!, $phone_number: String!) {
        insert_imsdb_customer_one(
          object: {
            address: $address,
            customer_name: $customer_name,
            phone_number: $phone_number,
            accounts: { data: { account_type: "CUSTOMER" } }
          }
        ) {
          customer_id
        }
      }
    `;
        const variables = {
            customer_name: customerName,
            address: address,
            phone_number: phoneNumber,
        };

        try {
            const response = await fetch(graphql, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hasura-admin-secret': apiKey,
                },
                body: JSON.stringify({ query: mutation, variables }),
            });

            const data = await response.json();

            if (data.errors) {
                throw new Error(data.errors[0].message);
            }

            setMessage(`Customer added successfully! Customer ID: ${data.data.insert_imsdb_customer_one.customer_id}`);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="customer_name">Customer Name:</label>
                <input
                    type="text"
                    id="customer_name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="address">Address:</label>
                <input
                    type="text"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="phone_number">Phone Number:</label>
                <input
                    type="text"
                    id="phone_number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                />
            </div>
            <button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Add Customer'}
            </button>
            {message && <p>{message}</p>}
        </form>
    );
}