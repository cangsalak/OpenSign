import React, { useState, useEffect } from "react";
import Parse from "parse";
import axios from "axios";

const AppendFormInForm = (props) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addYourself, setAddYourself] = useState(false);
  const [isLoader, setIsLoader] = useState(false);
  const [isUserExist, setIsUserExist] = useState(false);
  const parseBaseUrl = localStorage.getItem("baseUrl");
  const parseAppId = localStorage.getItem("parseAppId");

  useEffect(() => {
    checkUserExist();
  }, []);
  // Load user details from localStorage when the component mounts
  useEffect(() => {
    const savedUserDetails = JSON.parse(
      localStorage.getItem("UserInformation")
    );
    if (savedUserDetails && addYourself) {
      setName(savedUserDetails.name);
      setPhone(savedUserDetails.phone);
      setEmail(savedUserDetails.email);
    }
  }, [addYourself]);

  const checkUserExist = async () => {
    const user = Parse.User.current();
    try {
      const query = new Parse.Query("contracts_Contactbook");
      query.equalTo("CreatedBy", user);
      query.notEqualTo("IsDeleted", true);
      query.equalTo("Email", user.getEmail());
      const res = await query.first();
      // console.log(res);
      if (!res) {
        setIsUserExist(true);
      }
    } catch (err) {
      console.log("err", err);
    }
  };
  // Define a function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoader(true);
    Parse.serverURL = parseBaseUrl;
    Parse.initialize(parseAppId);
    try {
      const contactQuery = new Parse.Object("contracts_Contactbook");
      contactQuery.set("Name", name);
      contactQuery.set("Phone", phone);
      contactQuery.set("Email", email);
      contactQuery.set("UserRole", "contracts_Guest");

      if (localStorage.getItem("TenetId")) {
        contactQuery.set("TenantId", {
          __type: "Pointer",
          className: "partners_Tenant",
          objectId: localStorage.getItem("TenetId")
        });
      }

      try {
        const _users = Parse.Object.extend("User");
        const _user = new _users();
        _user.set("name", name);
        _user.set("username", email);
        _user.set("email", email);
        _user.set("phone", phone);
        _user.set("password", phone);

        const user = await _user.save();
        if (user) {
          const roleurl = `${parseBaseUrl}functions/AddUserToRole`;
          const headers = {
            "Content-Type": "application/json",
            "X-Parse-Application-Id": parseAppId,
            sessionToken: localStorage.getItem("accesstoken")
          };
          const body = {
            appName: localStorage.getItem("_appName"),
            roleName: "contracts_Guest",
            userId: user.id
          };
          await axios.post(roleurl, body, { headers: headers });
          const currentUser = Parse.User.current();
          contactQuery.set(
            "CreatedBy",
            Parse.User.createWithoutData(currentUser.id)
          );

          contactQuery.set("UserId", user);
          const acl = new Parse.ACL();
          acl.setPublicReadAccess(true);
          acl.setPublicWriteAccess(true);
          acl.setReadAccess(currentUser.id, true);
          acl.setWriteAccess(currentUser.id, true);

          contactQuery.setACL(acl);

          const res = await contactQuery.save();

          const parseData = JSON.parse(JSON.stringify(res));
          props.details({
            value: parseData[props.valueKey],
            label: parseData[props.displayKey]
          });
          if (props.closePopup) {
            props.closePopup();
          }

          setIsLoader(false);
          // Reset the form fields
          setAddYourself(false);
          setName("");
          setPhone("");
          setEmail("");
        }
      } catch (err) {
        console.log("err ", err);
        if (err.code === 202) {
          const params = { email: email };
          const userRes = await Parse.Cloud.run("getUserId", params);
          const roleurl = `${parseBaseUrl}functions/AddUserToRole`;
          const headers = {
            "Content-Type": "application/json",
            "X-Parse-Application-Id": parseAppId,
            sessionToken: localStorage.getItem("accesstoken")
          };
          const body = {
            appName: localStorage.getItem("_appName"),
            roleName: "contracts_Guest",
            userId: userRes.id
          };
          await axios.post(roleurl, body, { headers: headers });
          const currentUser = Parse.User.current();
          contactQuery.set(
            "CreatedBy",
            Parse.User.createWithoutData(currentUser.id)
          );

          contactQuery.set("UserId", {
            __type: "Pointer",
            className: "_User",
            objectId: userRes.id
          });
          const acl = new Parse.ACL();
          acl.setPublicReadAccess(true);
          acl.setPublicWriteAccess(true);
          acl.setReadAccess(currentUser.id, true);
          acl.setWriteAccess(currentUser.id, true);

          contactQuery.setACL(acl);
          const res = await contactQuery.save();

          const parseData = JSON.parse(JSON.stringify(res));
          props.details({
            value: parseData[props.valueKey],
            label: parseData[props.displayKey]
          });
          if (props.closePopup) {
            props.closePopup();
          }
          setIsLoader(false);
          // Reset the form fields
          setAddYourself(false);
          setName("");
          setPhone("");
          setEmail("");
        }
      }
    } catch (err) {
      // console.log("err", err);
      setIsLoader(false);
      alert("something went wrong!");
    }
  };

  // Define a function to handle the "add yourself" checkbox
  const handleAddYourselfChange = () => {
    if (addYourself) {
      setAddYourself(false);
      setName("");
      setPhone("");
      setEmail("");
    } else {
      setAddYourself(true);
    }
  };
  const handleReset = () => {
    setAddYourself(false);
  };

  return (
    <div className="h-full p-[20px]">
      {isLoader && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-30">
          <div
            style={{
              fontSize: "45px",
              color: "#3dd3e0"
            }}
            className="loader-37"
          ></div>
        </div>
      )}
      <div className="w-full mx-auto p-2">
        {isUserExist && (
          <div className="mb-3">
            <input
              type="checkbox"
              id="addYourself"
              checked={addYourself}
              onChange={handleAddYourselfChange}
              className="form-checkbox"
            />
            <label htmlFor="addYourself" className="ml-2 text-gray-700">
              Add Yourself
            </label>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label
              htmlFor="name"
              className="block text-xs text-gray-700 font-semibold"
            >
              Name
              <span style={{ color: "red", fontSize: 13 }}> *</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={addYourself}
              className="px-3 py-2 w-full border-[1px] border-gray-300 rounded focus:outline-none text-xs"
            />
          </div>
          <div className="mb-3">
            <label
              htmlFor="email"
              className="block text-xs text-gray-700 font-semibold"
            >
              Email
              <span style={{ color: "red", fontSize: 13 }}> *</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={addYourself}
              className="px-3 py-2 w-full border-[1px] border-gray-300 rounded focus:outline-none text-xs"
            />
          </div>
          <div className="mb-3">
            <label
              htmlFor="phone"
              className="block text-xs text-gray-700 font-semibold"
            >
              Phone
              <span style={{ color: "red", fontSize: 13 }}> *</span>
            </label>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={addYourself}
              className="px-3 py-2 w-full border-[1px] border-gray-300 rounded focus:outline-none text-xs"
            />
          </div>

          <div className="mt-4 flex justify-start">
            <button
              type="submit"
              className="bg-[#1ab6ce] text-sm text-white px-4 py-2 rounded shadow focus:outline-none"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => handleReset()}
              className="bg-[#188ae2] text-sm text-white px-4 py-2 rounded ml-2 shadow focus:outline-none"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppendFormInForm;
