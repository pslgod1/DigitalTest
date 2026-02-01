package org.example.digitaltest.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {
    @GetMapping
    public String index() {
        return "forward:/mainForm.html";
    }

    @GetMapping("/login")
    public String login() {
        return "forward:/loginForm.html";
    }

    @GetMapping("/codeEmail")
    public String code() {
        return "forward:/emailVerification.html";
    }

    @GetMapping("/register")
    public String register() {
        return "forward:/registerForm.html";
    }

    @GetMapping("/forgotPassword")
    public String forgot() {
        return "forward:/forgotPasswordForm.html";
    }

    @GetMapping("/admin")
    public String adminDashboard() {
        return "forward:/adminDashBoard.html";
    }


    @GetMapping("/adminResult")
    public String adminResult() {
        return "forward:/adminResultForm.html";
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "forward:/dashBoard.html";
    }

    @GetMapping("/result")
    public String result() {
        return "forward:/resultForm.html";
    }

    @GetMapping("/test")
    public String test() {
        return "forward:/testForm.html";
    }

    @GetMapping("/createTest")
    public String createTest(){return "forward:/adminCreateTest.html";}

    @GetMapping("/chooseTest")
    public String chooseTest(){return "forward:/chooseTestForm.html";}

    @GetMapping("/adminTests")
    public String adminTests(){return "forward:/adminTests.html";}

    @GetMapping("/history")
    public String history(){return "forward:/history.html";}

    @GetMapping("/recoveryPassword")
    public String recoveryPassword(){return "forward:/recoveryPassword.html";}

    @GetMapping("/emailForgotPassword")
    public String emailForgotPassword(){return "forward:/emailForgotPassword.html";}

    @GetMapping("/error")
    public String error(){return "forward:/errorForm.html";}
}
