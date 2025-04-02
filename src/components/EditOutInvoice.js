import React, { useState, useEffect } from "react";
import {TextField, MenuItem, Button, Box, Grid, CircularProgress, IconButton} from "@mui/material";
import {  Delete } from "@mui/icons-material";
import { Add, Remove } from "@mui/icons-material";
import { graphql, apiKey, companyID, getProductsURL, getInvoiceURL } from "../utils/commons";

export default function EditOutInvoice(props) {
    const {invoiceId,setEOpen} = props;
    const [formData, setFormData] = useState({
        truckNumber: "",
        modifyDate: "",
        customerId: "",
        products: [],
        accountId:"",
        accountBalance:"",
        oldTotalAmount:0
    });
    const [oldTotalAmount, setOldTotalAmount] = useState(0);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [error, setError] = useState(null);
    const [loadingInvoice, setLoadingInvoice] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingCustomers, setLoadingCustomers] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                console.log("Fetching invoice details of invoice " + invoiceId);
                const response = await fetch(`${getInvoiceURL}?invoiceid=${invoiceId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                });
                if (!response.ok) throw new Error(`Error: ${response.statusText}`);
                const data = await response.json();

                const invoice = data?.imsdb_invoice[0];
                //console.log("Invoice " + JSON.stringify(invoice));
                setFormData({
                    truckNumber: invoice.truck_number,
                    modifyDate: invoice.invoice_date,
                    customerId: invoice.customer_id,
                    oldTotalAmount: invoice.total_amount,
                    products: invoice.invoice_items.map(item => ({
                        productId: item.product_id,
                        quantity: item.quantity,
                        unitPrice: item.unit_price,
                        totalAmount: item.total_price,
                    })),
                    accountId: invoice.customer.accounts[0].account_id,
                    accountBalance: invoice.customer.accounts[0].balance
                });

                setLoadingInvoice(false);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchInvoice();
    }, [invoiceId]);


    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(getProductsURL, {
                    method: "GET",
                    headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                });
                if (!response.ok) throw new Error(`Error: ${response.statusText}`);
                const data = await response.json();

                setProducts(data.imsdb_product);
                setLoadingProducts(false);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch(graphql, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                    body: JSON.stringify({
                        query:`query fetchCustomers{
                          imsdb_customer {
                            customer_name
                            customer_id
                            accounts {
                              account_id
                            }
                          }
                        }`
                    })
                });
                if (!response.ok) throw new Error(`Error: ${response.statusText}`);
                const data = await response.json();

                setCustomers(data.data.imsdb_customer);
                setLoadingCustomers(false);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchCustomers();
    }, []);

    const handleProductChange = (index, e) => {
        const { name, value } = e.target;
        const updatedProducts = [...formData.products];
        updatedProducts[index][name] = value;
        updatedProducts[index].totalAmount = updatedProducts[index].quantity * updatedProducts[index].unitPrice;
        setFormData({ ...formData, products: updatedProducts });
    };

    const addProductRow = () => {
        setFormData({
            ...formData,
            products: [...formData.products, { productId: "", quantity: "", unitPrice: "", totalAmount: "" }],
        });
    };

    const removeProductRow = (index) => {
        const updatedProducts = [...formData.products];
        updatedProducts.splice(index, 1);
        setFormData({ ...formData, products: updatedProducts });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const totalAmount = formData.products.reduce((sum, item) => sum + Number(item.totalAmount), 0);
            let updatedAmount= formData.accountBalance - (formData.oldTotalAmount-totalAmount);
            console.log("Invoice ID " + invoiceId);
            console.log("FormData " + JSON.stringify(formData));
            console.log("updatedAmount ", updatedAmount);
            console.log("total Amount ", totalAmount);
            console.log("oldTotalAmount ", formData.oldTotalAmount);

            //  Fetching Account ID
            let accountResponse = await fetch(graphql, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                body: JSON.stringify({
                    query: `query getAccountId($customerId: Int!) {
                        imsdb_account(where: { customer_id: { _eq: $customerId } }) {
                            account_id
                            balance
                        }
                    }`,
                    variables: { customerId: formData.customerId },
                }),
            });
            let accountData = await accountResponse.json();
            let accountId = accountData.data.imsdb_account[0]?.account_id;
            //////////////////////

            const response = await fetch(graphql, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                body: JSON.stringify({
                    query:`
                    mutation updateInvoice(
                      $invoiceId: Int!,
                      $customerId: Int!,
                      $totalAmount: Int!,
                      $invoiceDate: date!,
                      $truckNumber: String!,
                      $status: String!,
                      $companyId: Int!,
                      $invoiceItems: [imsdb_invoice_item_insert_input!]!,
                      $updatedBalance: Int!,
                      $accountId:Int!
                    ) {
                      update_imsdb_invoice_by_pk(
                        pk_columns: { invoice_id: $invoiceId },
                        _set: {
                          customer_id: $customerId,
                          company_id: $companyId,
                          truck_number: $truckNumber,
                          total_amount: $totalAmount,
                          invoice_date: $invoiceDate,
                          status: $status
                        }
                      ) {
                        invoice_id
                        truck_number
                        total_amount
                        invoice_date
                        status
                      }
                    
                      delete_imsdb_invoice_item(where: { invoice_id: { _eq: $invoiceId } }) {
                        affected_rows
                      }
                    # Delete the related account transaction
                    delete_imsdb_account_transaction(
                        where: {
                        invoice_id: { _eq: $invoiceId }
                    }
                    ) {
                        affected_rows
                    }
                    
                    insert_imsdb_invoice_item(
                        objects: $invoiceItems
                    ) {
                        affected_rows
                    returning {
                          invoice_item_id
                          product_id
                          unit_price
                          quantity
                          total_price
                    }
                    }

                    insert_imsdb_account_transaction
                    (objects: {account_id: $accountId amount: $totalAmount, invoice_id: $invoiceId, 
                    transaction_date: $invoiceDate, transaction_type: "CREDIT"}){
                    affected_rows
                    }

                      # Update the account balance for the customer
                      update_imsdb_account_by_pk(
                        pk_columns: { account_id: $accountId },
                        _set: { balance: $updatedBalance }
                      ) {
                        account_id
                      }                      
                      
                    }`,
                    variables: {
                        invoiceId,
                        customerId: formData.customerId,
                        truckNumber: formData.truckNumber,
                        invoiceDate: formData.modifyDate,
                        totalAmount:totalAmount,
                        companyId: companyID,
                        status: "Pending",
                        invoiceItems: formData.products.map(item => ({
                            invoice_id:invoiceId,
                            product_id: Number(item.productId),
                            unit_price: Number(item.unitPrice),
                            quantity: Number(item.quantity),
                            total_price: Number(item.totalAmount),
                        })),
                        updatedBalance:updatedAmount,
                        accountId:accountId
                    }
                })
            });
            const responseData = await response.json();
            console.log("GraphQL Response:", responseData);
            if (responseData.errors) {
                console.error("GraphQL Errors:", responseData.errors);
                alert("Error updating invoice! " + responseData.errors[0].message);
                return;
            }
            alert("Invoice Updated Successfully!");
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this invoice?")) return;
        try {
            console.log("Deleting Invoice with ID:", invoiceId);
            console.log("Account ID:", formData.accountId);  // Debugging check


            const totalAmount = formData.products.reduce((sum, item) => sum + Number(item.totalAmount), 0);
            let updatedBalance=formData.accountBalance-totalAmount;

            const response = await fetch(graphql, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-hasura-admin-secret": apiKey },
                body: JSON.stringify({
                    query: `mutation deleteInvoice(
                              $invoiceId: Int!,
                              $accountId: Int!,
                              $updatedBalance: Int!
                            ) {
                              # Delete invoice items first (assuming foreign key constraint)
                              delete_imsdb_invoice_item(where: { invoice_id: { _eq: $invoiceId } }) {
                                affected_rows
                              }
                            
                            
                              # Update the account balance for the customer
                              update_imsdb_account_by_pk(
                                pk_columns: { account_id: $accountId },
                                _set: { balance: $updatedBalance }
                              ) {
                                account_id
                                balance
                              }
                            
                              # Delete the related account transaction
                              delete_imsdb_account_transaction(
                                where: {
                                  invoice_id: { _eq: $invoiceId }
                                }
                              ) {
                                affected_rows
                              }
                              
                              
                              # Delete the invoice
                              delete_imsdb_invoice_by_pk(invoice_id: $invoiceId) {
                                invoice_id
                                invoice_number
                              }
                            }`,
                    variables: {
                        invoiceId,
                        accountId:formData.accountId,
                        updatedBalance: updatedBalance
                    }
                })
            });
            const responseData = await response.json();
            if (responseData.errors) {
                console.error("GraphQL Errors:", responseData.errors);
                alert("Error deleting invoice! " + responseData.errors[0].message);
                return;
            }
            alert("Invoice Deleted Successfully!");
            setEOpen(false);
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    if (loadingInvoice || loadingProducts || loadingCustomers) {
        return <CircularProgress />;
    }

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField fullWidth label="Truck Number" name="truckNumber" value={formData.truckNumber} onChange={(e) => setFormData({ ...formData, truckNumber: e.target.value })} required />
                </Grid>
                <Grid item xs={6}>
                    <TextField fullWidth type="date" label="Date" name="modifyDate" value={formData.modifyDate} onChange={(e) => setFormData({ ...formData, modifyDate: e.target.value })} required />
                </Grid>
                <Grid item xs={12}>
                    <TextField fullWidth select label="Customer" name="customerId" value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })} required>
                        {customers.map(customer => (
                            <MenuItem key={customer.customer_id} value={customer.customer_id}>{customer.customer_name}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                {formData.products.map((product, index) => (
                    <Grid container item xs={12} spacing={3} key={index} alignItems="center">
                        <Grid item xs={4}>
                            <TextField fullWidth select label="Product" name="productId" value={product.productId} onChange={(e) => handleProductChange(index, e)} required>
                                {products.map(prod => (
                                    <MenuItem key={prod.product_id} value={prod.product_id}>{prod.product_name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={2}>
                            <TextField fullWidth label="Qty" type="number" name="quantity" value={product.quantity} onChange={(e) => handleProductChange(index, e)} required />
                        </Grid>
                        <Grid item xs={2}>
                            <TextField fullWidth label="Price" type="number" name="unitPrice" value={product.unitPrice} onChange={(e) => handleProductChange(index, e)} required />
                        </Grid>
                        <Grid item xs={2}>
                            <TextField fullWidth label="Total" type="number" name="totalAmount" value={product.totalAmount} InputProps={{ readOnly: true }} />
                        </Grid>
                        <Grid item xs={2}>
                            <IconButton onClick={() => removeProductRow(index)} disabled={formData.products.length === 1}><Remove /></IconButton>
                            <IconButton onClick={addProductRow}><Add /></IconButton>
                        </Grid>
                    </Grid>
                ))}
                <Grid container item xs={12} spacing={50}>
                    <Grid item xs={6}>
                        <Button variant="contained" color="primary" type="submit">Update Invoice</Button>
                    </Grid>

                    <Grid item xs={6}>
                        <Button variant="contained" color="secondary" startIcon={<Delete />} onClick={handleDelete}>
                            Delete Invoice
                        </Button>
                    </Grid>

                </Grid>
            </Grid>
        </Box>
    );
}
