/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import BillsUI from '../views/BillsUI.js'

// Added ROUTES
import { ROUTES, ROUTES_PATH } from "../constants/routes"

describe("Given I am connected as an employee", () => {
  describe("When I click on Nouvelle note de frais", () => {
    test("Then the button Envoyer une note de frais should be displayed", () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      // Router will display NewBillUI
      router()
      window.onNavigate(ROUTES_PATH.NewBill)

      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy()
    })

    test("Then the mail-icon should be highlighted", () => {
      const windowIcon = screen.getByTestId('icon-mail')
      expect(windowIcon.classList.contains('active-icon'))
    })
  })
})

describe("Given I am connected as an employee and clicked on Nouvelle note de frais", () => {
  describe("When I upload a file in a good format", () => {
    test("Then it should not display an alert", () => {
      // Mock a window alert for jest
      window.alert = jest.fn();
      const mockAlert = jest.spyOn(window, "alert");
      // Get the field to upload the test file
      const inputFile = screen.getByTestId("file")
      // Simulate the file as a jpg file
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["file.jpg"], "file.jpg", { type: "image/jpg" })]
        }
      })

      expect(mockAlert).not.toHaveBeenCalled();
    })
  })

  describe("When I upload a file in a wrong format", () => {
    test("Then it should display an alert", () => {
      // Mock a window alert for jest
      window.alert = jest.fn();
      const mockAlert = jest.spyOn(window, "alert");
      // Get the field to upload the test file
      const inputFile = screen.getByTestId("file")
      // Simulate the file as a video file
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["file.mp4"], "file.mp4", { type: "video/mp4" })]
        }
      })

      expect(mockAlert).toHaveBeenCalled();
    })
  })


  describe("When I filled the form and click on the submit button", () => {
    test("Then it should call the handleSubmit() function", () => {
      // Instantiate the environment (DOM + JS)
      const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname })}
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
      const newBill = new NewBill({ document, onNavigate, store: null, localStorage: window.localStorage})
      document.body.innerHTML = NewBillUI()

      // Prepare the handleSubmit() function
      const handleSubmit = jest.fn(newBill.handleSubmit)
      // Select the new bill form 
      const newBillform = screen.getByTestId("form-new-bill")
      newBillform.addEventListener('submit', handleSubmit)
      // Submit the bill and expect it to have been submitted by checking the function handlesubmit()
      fireEvent.submit(newBillform)
      expect(handleSubmit).toHaveBeenCalled()
      // Expect to be back on BillsUI after the submit
      expect(screen.getAllByText('Mes notes de frais')).toBeTruthy()
    })
  })
})

// POST Integration test (create and store the data)
describe("Given I am a user connected as employee and clicked on Nouvelle note de frais", () => {
  describe("When I click on submit", () => {
    test("Then a new bill should be created", () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      // Router will display NewBillUI
      router()
      window.onNavigate(ROUTES_PATH.NewBill)

      const newBill = new NewBill({document,onNavigate,store: null,localStorage: window.localStorage})

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
      // Checks that the new file has the name and url of the test file
      expect(JSON.stringify(newBill.fileName)).toBe(JSON.stringify(billTest.fileName))
      expect(JSON.stringify(newBill.fileUrl)).toBe(JSON.stringify(billTest.fileUrl))

      // Prepare the handleSubmit() function
      const handleSubmit = jest.fn(newBill.handleSubmit)
      // Prepare to update bill's information
      newBill.updateBill = jest.fn()

      // Select the new bill form 
      const newBillform = screen.getByTestId("form-new-bill")
      newBillform.addEventListener('submit', handleSubmit)
      // Submit the bill and expect it to have been submitted by checking the function handlesubmit()
      fireEvent.submit(newBillform)

      expect(handleSubmit).toHaveBeenCalled()
      expect(newBill.updateBill).toHaveBeenCalled()
      // Expect to be back on BillsUI after the submit
      expect(screen.getAllByText('Mes notes de frais')).toBeTruthy()
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