package LigaSync.API;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class LigasyncBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(LigasyncBackendApplication.class, args);
	}
}