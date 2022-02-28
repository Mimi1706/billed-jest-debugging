/**
 * @jest-environment jsdom
 */

// Add Mockstore
import mockStore from "../__mocks__/store"
// Add ROUTES
import { ROUTES, ROUTES_PATH } from "../constants/routes"
// Add Bills
import Bills from "../containers/Bills.js"

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

// Mock the store
jest.mock('../app/store', () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test('Then, a bill list should appear', () => {
      // Instantiate the environment 
      document.body.innerHTML = BillsUI({data:bills})
      // Expect to have 4 bills
      expect(bills.length).toBe(4)      
    })

    test("Then bill icon in vertical layout should be highlighted",  () => {
      // Instantiate the environment (DOM + JS)
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      // Router will display BillsUI
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      // The 'bills' icon should be highlighted in white 
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon'))
    })

    test("Then bills should be ordered from earliest to latest", () => {
      // Check the order of the bills
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe('When the page is loading', ()=>{
      test('Then the loading page appears', () => {
        // Trigger the loading
        const html = BillsUI({ data: bills, loading: true })
        document.body.innerHTML = html
        const loadingDiv = document.getElementById('loading')
        expect(loadingDiv).toBeDefined()
      })
    })

    describe('When the page has met an error', ()=>{
      test('Then the error page appears', () => {
        // Trigger an error
        const html = BillsUI({ data: bills, error: true })
        document.body.innerHTML = html
        const errorDiv = screen.getByTestId('error-message')
        expect(errorDiv).toBeDefined()
      })
    })
  })
})

describe("Given I am on the bills page", () => {
  describe("When I click on new bill", () => {
    test(("Then, it should render NewBill page"), () => {
      // Instantiate the environment (DOM + JS)
      const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname })}
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
      const bill = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage})
      document.body.innerHTML = BillsUI({data:bills})

      // Select the button "new bill" of BillsUI
      const buttonNewBill = screen.getByTestId('btn-new-bill')
      // Mock the action of the user clicking on "new bill"
      const clickNewBill = jest.fn(bill.handleClickNewBill)
      buttonNewBill.addEventListener('click', clickNewBill)
      // Fire the action
      fireEvent.click(buttonNewBill)
      expect(clickNewBill).toHaveBeenCalled()
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })
  })

  // Test when we click on the eye icon to open a modal
  describe("When I click on the eye icon", () => {
    test("Then, it should display the preview of the bill", () => {
      // Instantiate the environment (DOM + JS)
      const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname })}
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
      const bill = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage})
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html

      // Mock .modal for jest
      $.fn.modal = jest.fn();
      // Select the eye icon
      const eyes = screen.getAllByTestId("icon-eye");
      expect(eyes).toBeTruthy();
      // Mock the user clicking on the eye icon
      const clickEyeIcon = jest.fn(bill.handleClickIconEye(eyes[0]))
      eyes[0].addEventListener("click", clickEyeIcon);
      fireEvent.click(eyes[0]);
      expect(clickEyeIcon).toHaveBeenCalled();
      // Check if the modal is here
      const modal = screen.getByTestId("modal-window");
      expect(modal).toBeTruthy();
    })
  })
})

//test d'intégration GET
describe('Given I am a user connected as Employee', () => {
  describe('When I navigate to Bills', () => {
    test('fetches bills from mock API GET', async () => {
      localStorage.setItem('user',JSON.stringify({ type: 'Employee', email: 'a@a' }))
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      // The router will display BillsUI
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByText('Mes notes de frais'))
      expect(screen.getByText('Mes notes de frais')).toBeTruthy()
      expect(bills.length).toBe(4)     
    })
    
    describe('When an error occurs on API', () => {
      beforeEach(() => {
        jest.spyOn(mockStore, 'bills')
        Object.defineProperty(window, 'localStorage', {
          value: localStorageMock,
        })
        window.localStorage.setItem(
          'user',
          JSON.stringify({
            type: 'Employee',
            email: 'a@a',
          })
        )
        const root = document.createElement('div')
        root.setAttribute('id', 'root')
        document.body.appendChild(root)
        router()
      })

      test('fetches bills from an API and fails with 404 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 404'))
            },
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test('fetches messages from an API and fails with 500 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 500'))
            },
          }
        })

        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})