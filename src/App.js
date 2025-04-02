import React from "react";
import {TemplatePage} from "./components/TemplatePage";
import { BrowserRouter } from 'react-router-dom';
// Example Usage
function App() {
    return (
        <BrowserRouter>
            <TemplatePage>
            </TemplatePage>
        </BrowserRouter>
    );
}

export default App;