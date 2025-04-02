
export const styles = ({
    layout: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
    },
    header: {
        backgroundColor: "#3c44b1",
        color: "white",
        padding: "5px",
        textAlign: "center",
    },
    subHeader: {
        backgroundColor: "#3c44b1",
        color: "white",
        padding: "5px",
        textAlign: "center",
    },
    mainContent: {
        display: "flex",
        flex: 1,
    },
    sidebar: {
        width: "250px",
        backgroundColor: "#f4f4f4",
        padding: "20px",
        height: "100%",
    },
    sidebarList: {
        listStyle: "none",
        padding: 0,
    },
    sidebarListItem: {
        padding: "10px 0",
    },
    content: {
        flex: 1,
        padding: "20px",
    },
    footer: {
        backgroundColor: "#3c44b1",
        color: "white",
        textAlign: "center",
        padding: "5px",
    },
    container: {
        width: "85%",
        padding: "10px",
        paddingBlockEnd: "20px",
        //marginLeft:"30px"
        justifyContent: "center",
        alignContent: "center",
        margin: "auto", // This ensures centering horizontally

    },
    gridTable: {
        marginTop: '20px',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        overflow: 'hidden',
    },
    gridHeader: {
        display: 'grid',
        gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 1fr',
        padding: '15px 20px',
        backgroundColor: '#3c44b1',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    gridInvoiceHeader: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr 3fr 1fr',
        padding: '15px 20px',
        backgroundColor: '#3c44b1',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    gridInvHeader: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
        padding: '15px 20px',
        backgroundColor: '#3c44b1',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    gridHeaderItem: {
        textAlign: 'left',
        padding: '5px',
    },
    gridInvRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
        padding: '15px 20px',
        borderBottom: '1px solid #f0f0f0',
        fontSize: '14px',
    },
    gridInvoiceRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr 3fr 1fr',
        padding: '15px 20px',
        borderBottom: '1px solid #f0f0f0',
        fontSize: '12px',
    },
    gridRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 2fr 1fr 1fr 1fr 1fr',
        padding: '15px 20px',
        borderBottom: '1px solid #f0f0f0',
        fontSize: '12px',
    },
    gridCell: {
        padding: '5px',
        textAlign: 'left',
        fontSize: '12px',
    },
    button: {
        backgroundColor: "#3c44b1", // Primary color
        color: "white",
        padding: "10px 20px",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        transition: "background 0.3s ease, transform 0.2s ease",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    }
});