//(Mozilla, 2025)

// Shared display helpers so money and dates look the same on every page.
export const formatRand = (amount, decimals = 2) =>
    'R ' + Number(amount || 0).toLocaleString('en-ZA', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

export const formatDate = (value) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? ''
        : d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
};

//REFERENCE 

/* Mozilla, 2025. Number.prototype.toLocaleString(). [Online] 
Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString
[Accessed 10 October 2026]. */