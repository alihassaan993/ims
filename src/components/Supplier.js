import React, {useEffect, useState} from "react";
import {apiKey, getSuppliersURL} from "../utils/commons";
import {styles} from "../styles/styles";
import {Popup} from "./Popup";
import SupplierForm from "./SupplierForm";
import SupplierInventory from "./SupplierInventory";
import SupplierPaymentForm from "./SupplierPaymentForm";
import PaymentIcon from '@mui/icons-material/Payment';
import SupplierTransactions from "./SupplierTransactions";

export default function Supplier(props)  {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = React.useState(false);
    const [refresh, setRefresh] = React.useState(false);
    const [sopen, setSOpen] = React.useState(false);
    const [supplierId, setSupplierId] = React.useState(false);
    const [popen, setPOpen] = React.useState(false);
    const [topen, setTOpen] = React.useState(false);

    useEffect(() => {
        const fetchSupplier = async () => {
            try {
                const response = await fetch(getSuppliersURL, {
                    method: "GET", // or "POST" depending on your API
                    headers: {
                        "Content-Type": "application/json",
                        "x-hasura-admin-secret": apiKey,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                const data = await response.json();
                setSuppliers(data.imsdb_supplier);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchSupplier();
    }, [refresh]);

    if (loading) return <div>Loading Supplier...</div>;
    if (error) return <div>Error: {error}</div>;

    function fetchSupplierInventory(_supplierId){
        setSOpen(true);
        setSupplierId(_supplierId);
    }

    function addPayment(_supplierId){
        setPOpen(true);
        setSupplierId(_supplierId);
    }

    function transactionHistory(_supplierId){
        setTOpen(true);
        setSupplierId(_supplierId);
    }

    return(
        <>
            <div style={{display: "flex", justifyContent: "flex-end", marginBottom: "10px", marginRight: "10px"}}>
                <button style={styles.button} onClick={() => setOpen(true)}>Add Supplier</button>
            </div>
            <Popup openPopup={open} setOpenPopup={setOpen} title="Add Supplier">
                <SupplierForm setRefresh={setRefresh} setOpenPopup={setOpen}/>
            </Popup>
            <Popup openPopup={sopen} setOpenPopup={setSOpen} title="Supplier Inventory">
                <SupplierInventory supplierId={supplierId} />
            </Popup>
            <Popup openPopup={popen} setOpenPopup={setPOpen} title="Supplier Payment">
                <SupplierPaymentForm supplierId={supplierId} setPOpen={setPOpen} setRefresh={setRefresh}/>
            </Popup>

            <Popup openPopup={topen} setOpenPopup={setTOpen} title="Supplier Transactions">
                <SupplierTransactions supplierId={supplierId} setTOpen={setTOpen} setRefresh={setRefresh}/>
            </Popup>

            <div style={styles.gridTable}>
                {/* Table Header */}
                <div style={styles.gridHeader}>
                    <div style={styles.gridHeaderItem}>S. No.</div>
                    <div style={styles.gridHeaderItem}>Supplier Name</div>
                    <div style={styles.gridHeaderItem}>Payable Amount</div>
                    <div style={styles.gridHeaderItem}>&nbsp;</div>
                </div>

                {suppliers.map((supplier, index) => (
                    <div style={styles.gridRow} key={index}>
                        <div style={styles.gridCell}>{index + 1}</div>
                        <div style={styles.gridCell} onClick={() => fetchSupplierInventory(supplier.supplier_id)}>
                            <div style={{color: "blue",
                                textDecoration: "underline",
                                cursor: "pointer"}}>
                                {supplier.supplier_name}
                            </div>
                            Phone Number:{supplier.phoneNumber}
                        </div>
                        <div style={styles.gridCell}>
                            {supplier.accounts?.[0]?.balance != null
                                ? "Rs. " + supplier.accounts[0].balance.toLocaleString()
                                : 0}
                        </div>
                        <div style={styles.gridCell}>
                            <button variant="contained"
                                    onClick={() => addPayment(supplier.supplier_id)}>
                                Make Payment
                            </button>

                        </div>
                        <div style={styles.gridCell}>
                            <button variant="contained"
                                    onClick={() => transactionHistory(supplier.supplier_id)}>
                                Transaction History
                            </button>
                        </div>
                    </div>
                ))}
            </div>

        </>
    )
}