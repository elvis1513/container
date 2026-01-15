package com.geestack.www;

import com.geestack.www.config.AsyncSyncConfiguration;
import com.geestack.www.config.EmbeddedElasticsearch;
import com.geestack.www.config.EmbeddedRedis;
import com.geestack.www.config.EmbeddedSQL;
import com.geestack.www.config.JacksonConfiguration;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Base composite annotation for integration tests.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@SpringBootTest(classes = { ContainerApp.class, JacksonConfiguration.class, AsyncSyncConfiguration.class })
@EmbeddedRedis
@EmbeddedElasticsearch
@EmbeddedSQL
public @interface IntegrationTest {
}
