package org.example.digitaltest.user.domain;

import lombok.extern.slf4j.Slf4j;
import org.example.digitaltest.config.JwtTokenProvider;
import org.example.digitaltest.notify.EmailSenderService;
import org.example.digitaltest.user.api.dto.auth.*;
import org.example.digitaltest.user.db.Role;
import org.example.digitaltest.user.db.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class AuthService {
    private final UserService userService;

    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailSenderService emailSenderService;

    private static final Map<String, RegistrationData> pendingRegistrations = new ConcurrentHashMap<>();
    private static final Map<String, ResetData> passwordResets = new ConcurrentHashMap<>();

    @Autowired
    public AuthService(UserService userService, PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider, AuthenticationManager authenticationManager, EmailSenderService emailSenderService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationManager = authenticationManager;
        this.emailSenderService = emailSenderService;
    }

    //================================Controller Methods================================================

    public LoginResponse login(LoginRequest loginRequest, HttpServletResponse response) {
        try {

            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.email(), loginRequest.password()
                    )
            );

            UserEntity user = userService.findByEmail(loginRequest.email());

            Cookie cookie = new Cookie("jwtToken", jwtTokenProvider.createToken(user.getEmail(), user.getRole().name()));
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(24 * 60 * 60);
            response.addCookie(cookie);

            Set<SimpleGrantedAuthority> roles = Collections.singleton(user.getRole().toAuthority());
            Authentication authToken = new UsernamePasswordAuthenticationToken(
                    user.getEmail(),
                    null,
                    roles
            );
            SecurityContextHolder.getContext().setAuthentication(authToken);

            return new LoginResponse(true, "Успешный вход", user.getRole() == Role.USER ? "/dashboard" : "/admin");

        } catch (Exception e) {
            return new LoginResponse(false, "Неверный email или пароль", null);
        }
    }

    public SimpleResponse logout(HttpServletResponse response) {
        try {
            SecurityContextHolder.clearContext();

            Cookie cookie = new Cookie("jwtToken", null);
            cookie.setPath("/");
            cookie.setHttpOnly(true);
            cookie.setMaxAge(0);
            response.addCookie(cookie);

            return new SimpleResponse(true, "Успешный выход");

        } catch (Exception e) {
            return new SimpleResponse(false, "Ошибка при выходе");
        }
    }

    public Object sendRegistrationCode(RegisterCodeRequest request) {
        try {
            String email = request.email();
            String password = request.password();

            if (userService.findByEmail(email) != null) {
                return new SimpleResponse(false, "Пользователь с таким email уже существует");
            }

            String verificationCode = emailSenderService.generateVerificationCode();
            String registrationId = UUID.randomUUID().toString();

            log.debug("Code email={}", verificationCode);

            UserEntity tempUser = new UserEntity();
            tempUser.setEmail(email);
            tempUser.setPassword(passwordEncoder.encode(password));
            if (request.name() != null && !request.name().isEmpty()) {
                tempUser.setName(request.name());
            }

            pendingRegistrations.put(registrationId,
                    new RegistrationData(tempUser, verificationCode));

            emailSenderService.sendCode(tempUser.getEmail(),verificationCode);

            cleanupExpiredData();

            return new RegistrationResponse(true, "Код подтверждения отправлен на email", registrationId);

        } catch (Exception e) {
            return new SimpleResponse(false, "Ошибка при отправке кода: " + e.getMessage());
        }
    }

    public Object verifyRegistration(VerifyRegisterRequest request, HttpServletResponse response) {
        try {

            RegistrationData data = pendingRegistrations.get(request.registrationId());

            if (data == null) {
                return new SimpleResponse(false, "Регистрация не найдена");
            }

            if (data.isExpired()) {
                pendingRegistrations.remove(request.registrationId());
                return new SimpleResponse(false, "Время действия кода истекло");
            }

            if (!request.code().equals(data.verificationCode)) {
                return new SimpleResponse(false, "Неверный код подтверждения");
            }

            UserEntity user = data.user;
            user.setCreatedAt(LocalDateTime.now());
            user.setRole(Role.USER);
            UserEntity savedUser = userService.save(user);

            String token = jwtTokenProvider.createToken(savedUser.getEmail(), savedUser.getRole().name());
            Cookie cookie = new Cookie("jwtToken", token);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(24 * 60 * 60);
            response.addCookie(cookie);

            Set<SimpleGrantedAuthority> roles = Collections.singleton(Role.USER.toAuthority());
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    savedUser.getEmail(), null, roles);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            pendingRegistrations.remove(request.registrationId());

            return new LoginResponse(true, "Регистрация успешно завершена", "/dashboard");

        } catch (Exception e) {
            return new SimpleResponse(false, "Ошибка при подтверждении регистрации: " + e.getMessage());
        }
    }

    public SimpleResponse resendVerificationCode(String registrationId) {
        try {
            RegistrationData data = pendingRegistrations.get(registrationId);

            if (data == null || data.isExpired()) {
                return new SimpleResponse(false, "Регистрация не найдена или истекла");
            }

            String newCode = emailSenderService.generateVerificationCode();
            data.verificationCode = newCode;
            data.timestamp = System.currentTimeMillis();

            emailSenderService.sendCode(data.user.getEmail(), newCode);

            return new SimpleResponse(true, "Новый код отправлен на email");

        } catch (Exception e) {
            return new SimpleResponse(false, "Ошибка отправки кода: " + e.getMessage());
        }
    }

    public Object forgotPassword(String email) {
        try {
            UserEntity user = userService.findByEmail(email);
            if (user == null) {
                return new SimpleResponse(false, "Пользователь с таким email не найден");
            }

            String resetCode = emailSenderService.generateVerificationCode();
            String resetId = UUID.randomUUID().toString();

            passwordResets.put(resetId, new ResetData(email, resetCode));

            emailSenderService.sendCode(email, resetCode);

            return new PasswordResetResponse(true, "Код для сброса пароля отправлен на email", resetId);

        } catch (Exception e) {
            return new SimpleResponse(false, "Ошибка: " + e.getMessage());
        }
    }

    public Object verifyResetCode(String resetId, String code) {
        try {
            ResetData data = passwordResets.get(resetId);

            if (data == null || data.isExpired()) {
                return new SimpleResponse(false, "Код не найден или истек");
            }

            if (!code.equals(data.code)) {
                return new SimpleResponse(false, "Неверный код подтверждения");
            }

            return new PasswordResetResponse(true, "Код подтвержден", resetId);

        } catch (Exception e) {
            return new SimpleResponse(false, "Ошибка: " + e.getMessage());
        }
    }

    public Object resetPassword(ResetPasswordRequest request, HttpServletResponse response) {
        try {
            ResetData data = passwordResets.get(request.resetId());

            if (data == null) {
                return new SimpleResponse(false, "Недействительный запрос сброса");
            }


            if (!request.newPassword().equals(request.confirmPassword())) {
                return new SimpleResponse(false, "Пароли не совпадают");
            }

            UserEntity user = userService.findByEmail(data.email);
            if (user == null) {
                return new SimpleResponse(false, "Пользователь не найден");
            }

            userService.changePassword(user.getEmail(), passwordEncoder.encode(request.newPassword()));

            Cookie cookie = new Cookie("jwtToken", jwtTokenProvider.createToken(user.getEmail(), user.getRole().name()));
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(24 * 60 * 60);
            response.addCookie(cookie);

            Set<SimpleGrantedAuthority> roles = Collections.singleton(user.getRole().toAuthority());
            Authentication authentication = new UsernamePasswordAuthenticationToken(user.getEmail(), null, roles);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            passwordResets.remove(request.resetId());

            return new LoginResponse(true, "Пароль успешно изменен", "/dashboard");

        } catch (Exception e) {
            return new SimpleResponse(false, "Ошибка при сбросе пароля: " + e.getMessage());
        }
    }

    //================================Service Methods================================================

    private void cleanupExpiredData() {
        pendingRegistrations.entrySet().removeIf(entry -> entry.getValue().isExpired());
        passwordResets.entrySet().removeIf(entry -> entry.getValue().isExpired());
    }


    private static class RegistrationData {
        UserEntity user;
        String verificationCode;
        long timestamp;

        RegistrationData(UserEntity user, String verificationCode) {
            this.user = user;
            this.verificationCode = verificationCode;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > 15 * 60 * 1000; // 15 минут
        }
    }

    private static class ResetData {
        String email;
        String code;
        long timestamp;

        ResetData(String email, String code) {
            this.email = email;
            this.code = code;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - timestamp > 15 * 60 * 1000; // 15 минут
        }
    }
}
