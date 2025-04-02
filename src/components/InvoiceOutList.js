import React, { useEffect, useState } from "react";
import { graphql,apiKey } from "../utils/commons";
import { styles } from "../styles/styles";
import { Popup } from "./Popup";
import InvoiceOutForm from "./InvoiceOutForm";
import EditOutInvoice from "./EditOutInvoice";


export default function InvoiceOutList() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [eopen, setEOpen] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [invoiceId, setInvoiceId] = useState(null);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await fetch(graphql, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-hasura-admin-secret": apiKey,
                    },
                    body: JSON.stringify({
                        query: `query fetchInvoices {
                          imsdb_invoice(order_by: { invoice_date: desc }, where: {invoice_type: {_eq: "SELL"}}) {
                            invoice_id
                            truck_number
                            invoice_date
                            total_amount
                            status
                            customer {
                              customer_name
                            }
                            invoice_items {
                              product {
                                product_name
                              }
                              quantity
                              unit_price
                              total_price
                            }
                          }
                        }`
                    })
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                const result = await response.json();
                setInvoices(result.data.imsdb_invoice);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchInvoices();
    }, [refresh]);

    if (loading) return <div>Loading Invoices...</div>;
    if (error) return <div>Error: {error}</div>;

    function editInvoice(_invoiceId) {
        setRefresh(false);
        setEOpen(true);
        setInvoiceId(_invoiceId);
    }

    function addInvoice() {
        setRefresh(false);
        setOpen(true);
    }

    return (
        <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px", marginRight: "10px" }}>
                <button style={styles.button} onClick={() => addInvoice()}>Add Invoice</button>
            </div>
            <Popup openPopup={open} setOpen={setOpen} setOpenPopup={setOpen} title="Add Invoice">
                <InvoiceOutForm setRefresh={setRefresh} setOpen={setOpen} />
            </Popup>
            <Popup openPopup={eopen} setEPopup={setEOpen} setOpenPopup={setEOpen} title="Edit Invoice">
                <EditOutInvoice invoiceId={invoiceId} setEOpen={setEOpen} />
            </Popup>

            <div style={styles.gridTable}>
                {/* Table Header */}
                <div style={styles.gridInvoiceHeader}>
                    <div style={styles.gridHeaderItem}>Truck Number</div>
                    <div style={styles.gridHeaderItem}>Customer</div>
                    <div style={styles.gridHeaderItem}>Total Amount</div>
                    <div style={styles.gridHeaderItem}>Date</div>
                    <div style={styles.gridHeaderItem}>&nbsp;</div>
                    <div style={styles.gridHeaderItem}>&nbsp;</div>
                </div>

                {invoices.map((invoice, index) => (
                    <div key={invoice.invoice_id} style={styles.gridInvoiceRow}>
                        <div style={styles.gridCell}>{invoice.truck_number}</div>
                        <div style={styles.gridCell}>{invoice.customer.customer_name}</div>
                        <div style={styles.gridCell}>Rs. {invoice.total_amount.toLocaleString()}</div>
                        <div style={styles.gridCell}>{new Date(invoice.invoice_date).toLocaleDateString()}</div>
                        {/* Invoice Items */}
                        <div style={{marginLeft: "20px", marginTop: "10px"}}>
                            <b>PRODUCTS:</b>
                            <ul>
                                {invoice.invoice_items.map((item, i) => (
                                    <li key={i}>
                                        {item.product.product_name} - {item.quantity} x {item.unit_price.toFixed(2)} = Rs. {item.total_price.toLocaleString()}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div    style={{
                            ...styles.gridCell,
                            color: "blue",
                            textDecoration: "underline",
                            cursor: "pointer"
                        }}  onClick={()=>editInvoice(invoice.invoice_id)}>Edit</div>
                    </div>
                ))}
            </div>
        </>
    );
}