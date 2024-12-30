// Mobile Responsiveness Tests using Jest and Testing Library
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Mobile Responsiveness', () => {
    let dom;
    let document;
    let window;

    beforeEach(() => {
        // Load the HTML file
        const html = fs.readFileSync(path.resolve(__dirname, '../templates/index.html'), 'utf8');
        dom = new JSDOM(html, {
            runScripts: 'dangerously',
            resources: 'usable',
            pretendToBeVisual: true
        });
        document = dom.window.document;
        window = dom.window;
    });

    test('sticky-table-container has proper mobile styles', () => {
        const container = document.querySelector('.sticky-table-container');
        const styles = window.getComputedStyle(container);
        
        expect(styles.width).toBe('100%');
        expect(styles.overflowX).toBe('auto');
        expect(styles.position).toBe('relative');
    });

    test('sticky table maintains minimum width for readability', () => {
        const table = document.querySelector('.sticky-table');
        const styles = window.getComputedStyle(table);
        
        expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(800);
    });

    test('first column is sticky on mobile', () => {
        const firstColumn = document.querySelector('.sticky-table th:first-child');
        const styles = window.getComputedStyle(firstColumn);
        
        expect(styles.position).toBe('sticky');
        expect(styles.left).toBe('0px');
    });

    test('chart containers are responsive', () => {
        const container = document.querySelector('.chart-container');
        const styles = window.getComputedStyle(container);
        
        expect(styles.width).toBe('100%');
        expect(styles.overflowX).toBe('auto');
    });

    test('mobile optimizations are applied at breakpoint', () => {
        // Simulate mobile viewport
        window.innerWidth = 375;
        window.dispatchEvent(new Event('resize'));

        const container = document.querySelector('.container');
        const styles = window.getComputedStyle(container);
        
        expect(parseFloat(styles.padding)).toBeLessThanOrEqual(8); // 0.5rem
    });

    test('buttons are touch-friendly on mobile', () => {
        // Simulate mobile viewport
        window.innerWidth = 375;
        window.dispatchEvent(new Event('resize'));

        const button = document.querySelector('.btn');
        const styles = window.getComputedStyle(button);
        
        expect(parseFloat(styles.padding)).toBeGreaterThanOrEqual(8); // At least 0.5rem
    });
});
