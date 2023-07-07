import { fireEvent, render, screen } from '@testing-library/vue'
import { ref } from 'vue'


const Component = {
    setup() {
        const count = ref(0)
        return { count }
    },
    template: `
    <div>
    <span>
    Times clicked: {{ count }}
    </span>
    <button @click="count++">
    increment
    </button>
    </div>
    `
    // Can also target an in-DOM template:
    // template: '#my-template-element'
}

test('increments value on click', async () => {
    render(Component)

    // screen has all queries that you can use in your tests.
    // getByText returns the first matching node for the provided text, and
    // throws an error if no elements match or if more than one match is found.
    screen.getByText('Times clicked: 0')

    const button = screen.getByText('increment')

    // Dispatch a native click event to our button element.
    await fireEvent.click(button)
    await fireEvent.click(button)

    screen.getByText('Times clicked: 2')
})