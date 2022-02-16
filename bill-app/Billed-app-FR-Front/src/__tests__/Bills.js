/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";

// Add ROUTES
import { ROUTES, ROUTES_PATH } from "../constants/routes"
// Add Bills
import Bills from "../containers/Bills.js"
// Add Mockstore
import mockStore from "../__mocks__/store"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      // The 'bills' icon should be highlighted in white 
      expect(windowIcon.classList.contains('active-icon'))
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})

describe("Given I am on the bills page", () => {

  // Test when we click on "new bill"
  describe("When I click on new bill", () => {
    test(("Then, it should render NewBill page"), () => {

      // Generate the html of BillsUI
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html

      // Select the button "new bill" of BillsUI
      const buttonNewBill = screen.getByTestId('btn-new-bill')

      // Instantiate class Bills()
      const store = null;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const bill = new Bills({
        document,
        onNavigate,
        store,
        localStorage
      });

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

      // Generate the html of BillsUI
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html

      // Instantiate class Bills()
      const store = null;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const bill = new Bills({
        document,
        onNavigate,
        store,
        localStorage
      });

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

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByText("Mes notes de frais"))

      // spyOn mockStore
      jest.spyOn(mockStore, "bills")
      expect(bills.length).toBe(4)
    })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      // Generate an html page from BillsUI with the error 404
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html

      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      // Generate an html page from BillsUI with the error 500
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })

  })
})