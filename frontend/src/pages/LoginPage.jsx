import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import Silk from '../PagesUI/Silk.jsx';
import BlurText from '../PagesUI/BlurText.jsx';
import CurvedLoop from '../PagesUI/CurvedLoop.jsx';

const LoginPage = () => {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  // ---------------- LOGIN ----------------
  const handleLogin = async (e) => {

    e.preventDefault();

    if (!username || !password) {
      alert("Please enter email and password");
      return;
    }

    try {

      const res = await fetch("https://iveras-production.up.railway.app/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: username,
          password: password
        })
      });

      const data = await res.json();

      if (res.ok) {

        // Save user data
        localStorage.setItem("user", JSON.stringify(data));

        alert("Welcome " + data.name);

        navigate("/dashboard");

      } else {

        alert(data.error || "Login failed");

      }

    } catch (err) {

      console.error(err);
      alert("Server error. Try again later.");

    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
  };

  const handleBlurTextComplete = () => {
    console.log('Login blur text animation completed!');
  };

  // ---------------- UI ----------------
  return (

    <div className="login-page-root">

      <div className="login-silk-bg">
        <Silk
          speed={9}
          scale={1}
          color="#6825cc"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      <div className="login-page">
        <div className="login-content">

          <div className="login-blurtext-wrapper">
            <BlurText
              text="Good To See YOU Again Amigo ! "
              delay={225}
              animateBy="letters"
              direction="top"
              onAnimationComplete={handleBlurTextComplete}
              className="login-blurtext"
            />
          </div>

          <div className="login-card-block">
            <div className="form-wrapper">

              <form className="form" onSubmit={handleLogin}>

                <p id="heading">ACCESS IVERAS</p>

                <div className="field">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Email"
                    autoComplete="off"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="field">
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="btn">
                  <button type="submit" className="button1">
                    ACCESS
                  </button>
                </div>

                <button
                  type="button"
                  className="button3"
                  onClick={handleForgotPassword}
                >
                  Forgot Password
                </button>

              </form>

            </div>

            <div className="login-curvedloop-wrapper">
              <CurvedLoop
                marqueeText="TEAM ✦ PADMA ✦ VYUHA ✦ "
                speed={0.7}
                curveAmount={120}
                direction="right"
                interactive
                className="login-curvedloop-text"
              />
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

export default LoginPage;