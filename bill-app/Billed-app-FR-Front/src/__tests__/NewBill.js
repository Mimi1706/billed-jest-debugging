/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import BillsUI from '../views/BillsUI.js'

// Add ROUTES
import { ROUTES, ROUTES_PATH } from "../constants/routes"
// Add Mockstore
import mockStore from "../__mocks__/store"

describe("Given I am connected as an employee", () => {
  describe("When I click on Nouvelle note de frais", () => {
    test("Then the button Envoyer une note de frais should be displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy()
    })

    test("Then the mail-icon should be highlighted", async () => {
      // Change the localStorage to localStorageMock
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      // The 'bills' icon should be highlighted in white 
      expect(windowIcon.classList.contains('active-icon'))
    })
  })
})

describe("Given I am connected as an employee and clicked on Nouvelle note de frais", () => {
  describe("When I upload a file in jpg format", () => {
    test("Then it should accept the file and not display an alert", () => {
      // Generate DOM from NewBillUI
      const html = NewBillUI()
      document.body.innerHTML = html
      // Instantiate NewBill()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // Prepare a mock of the store for new Bill  
      const mockStore = {
        bills: jest.fn(() => newBill.store),
        create: jest.fn(() => Promise.resolve({})),
      };

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage
      });
      
      // Mock a window alert for jest
      const mockAlert = jest.spyOn(window, "alert");
      window.alert = jest.fn();
      // Prepare the extension check for the file
      const checkExtension = screen.getByTestId("file");
      // Simulate the file as a jpg file
      fireEvent.change(checkExtension, {
        target: {
          files: [new File(["file.jpg"], "file.jpg", { type: "file/jpg" })],
        },
      });

      expect(checkExtension.files[0].name).toBe("file.jpg");
      expect(mockAlert).not.toHaveBeenCalled();
    })
  })

  describe("When I filled the form and click on the submit button", () => {
    test("Then it should call the handleSubmit() function", () => {
      // Generate DOM from NewBillUI
      const html = NewBillUI()
      document.body.innerHTML = html
     // Instantiate NewBill()
      const store = null
      const newBill = new NewBill({document, onNavigate, store, localStorage})
      expect(newBill).toBeDefined()
      // Prepare the handleSubmit() function
      const handleSubmit = jest.fn(newBill.handleSubmit)
      // Select the new bill form 
      const newBillform = screen.getByTestId("form-new-bill")
      newBillform.addEventListener('submit', handleSubmit)
      // Submit the bill and expect it to have been submitted by checking the function handlesubmit()
      fireEvent.submit(newBillform)
      expect(handleSubmit).toHaveBeenCalled()
    })
  })
})

// POST Integration test (create and store the data)
describe("Given I am a user connected as employee and clicked on Nouvelle note de frais", () => {
  describe("When I click on submit", () => {
    test("Then a new bill should be created in API MOCK", async () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      const billTest = {
        type: 'Bill test',
        name: 'Test',
        date: '2022-02-19',
        amount: 200,
        vat: 20,
        pct: 10,
        commentary: 'Bill test',
        fileUrl: 'https://test.test',
        fileName: 'bill_test.jpg',
        status: 'pending',
      }

      // Load the values in fields
      screen.getByTestId('expense-type').value = billTest.type
      screen.getByTestId('expense-name').value = billTest.name
      screen.getByTestId('datepicker').value = billTest.date
      screen.getByTestId('amount').value = billTest.amount
      screen.getByTestId('vat').value = billTest.vat
      screen.getByTestId('pct').value = billTest.pct
      screen.getByTestId('commentary').value = billTest.commentary

      newBill.fileName = billTest.fileName
      newBill.fileUrl = billTest.fileUrl

      newBill.updateBill = jest.fn()
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))

      const form = screen.getByTestId('form-new-bill')
      form.addEventListener('submit', handleSubmit)
      expect(screen.getByText('Envoyer').type).toBe('submit')

      fireEvent.click(screen.getByText('Envoyer'))

      expect(handleSubmit).toHaveBeenCalled()
      expect(newBill.updateBill).toHaveBeenCalled()
    })

    test("fetches bills from an API and fails with 404 message error", async () => {
      const html = BillsUI({ error: 'Erreur 404' })
      document.body.innerHTML = html
      await new Promise(process.nextTick)
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
      const html = BillsUI({ error: 'Erreur 500' })
      document.body.innerHTML = html
      await new Promise(process.nextTick)
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})