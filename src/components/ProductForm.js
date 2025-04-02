import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import {apiKey,companyID,addProductURL} from '../utils/commons';

export default function ProductForm() {
    const [productName, setProductName] = useState('');

    // Handle input change
    const handleChange = (e) => {
        setProductName(e.target.value);
    };

    // Handle add button click
    const handleAddProduct = async() => {

        if (!productName ) {
            alert("Please provide Product Name.");
            return;
        }

        try {
            const response = await fetch(addProductURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-hasura-admin-secret': apiKey, // Add your API key here
                },
                body: JSON.stringify({
                    company_id: companyID,
                    product_name: productName,
                }),
            });

            const data = await response.json();
            if (response.ok) {
                console.log('Product added successfully:', data);
                setProductName(''); // Clear input after successful addition

            } else {
                alert("Product Name already exists!");
                console.error('Error adding product:', data);
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    };

    // Handle clear button click
    const handleClear = () => {
        setProductName('');
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0 auto',
                padding: 2,
                border: '1px solid #ccc',
                borderRadius: '8px',
            }}
        >
            <TextField
                label="Product Name"
                value={productName}
                onChange={handleChange}
                margin="normal"
                required
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddProduct}
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