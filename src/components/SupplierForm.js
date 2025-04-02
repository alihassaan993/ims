import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import {apiKey, companyID, addProductURL, addSupplierURL} from '../utils/commons';

export default function SupplierForm(props) {
    const {setRefresh,setOpenPopup}=props;
    const [supplierName, setSupplierName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    // Handle input change
    const handleSupplierNameChange = (e) => {
        setSupplierName(e.target.value);
    };
    const handlePhoneNumberChange = (e) => {
        setPhoneNumber(e.target.value);
    };
    const handleAddressChange = (e) => {
        setAddress(e.target.value);
    };

    // Handle add button click
    const handleAddSupplier = async() => {

        if (!supplierName ) {
            alert("Please provide Supplier Name.");
            return;
        }

        try {
            const response = await fetch(addSupplierURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hasura-admin-secret': apiKey, // Add your API key here
                },
                body: JSON.stringify({
                    companyId: companyID,
                    supplierName: supplierName,
                    phoneNumber: phoneNumber,
                    address: address
                }),
            });

            const responseData = await response.json();
            console.log("GraphQL Response:", responseData);
            if (responseData.errors) {
                console.error("GraphQL Errors:", responseData.errors);
                alert("Error adding supplier! " + responseData.errors[0].message);
                return;
            }

            console.log('Supplier added successfully:', responseData);
            setSupplierName(''); // Clear input after successful addition
            setPhoneNumber('');
            setAddress('');
            setRefresh(true);
            setOpenPopup(false);

        } catch (error) {
            console.error('Network error:', error);
        }
    };

    // Handle clear button click
    const handleClear = () => {
        setSupplierName(''); // Clear input after successful addition
        setPhoneNumber('');
        setAddress('');
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '300px',
                margin: '0 auto',
                padding: 2,
                border: '1px solid #ccc',
                borderRadius: '8px',
            }}
        >
            <TextField
                label="Supplier Name"
                value={supplierName}
                onChange={handleSupplierNameChange}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Phone Number"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Address"
                value={address}
                onChange={handleAddressChange}
                fullWidth
                margin="normal"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddSupplier}
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